import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { env } from "../config/env.js";
import { mcpRegistry } from "../mcp/mcpRegistry.js";

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9_:\u4e00-\u9fa5-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildSearchText(descriptor) {
  return [
    descriptor.name,
    descriptor.description,
    JSON.stringify(descriptor.inputSchema || {}),
    `server:${descriptor.serverId}`,
  ].join("\n");
}

function scoreByKeyword(queryTokens, descriptor) {
  if (queryTokens.length === 0) return 0;
  const name = String(descriptor.name || "").toLowerCase();
  const description = String(descriptor.description || "").toLowerCase();
  const schema = JSON.stringify(descriptor.inputSchema || {}).toLowerCase();
  const serverId = String(descriptor.serverId || "").toLowerCase();
  const fields = [
    { text: name, weight: 4 },
    { text: description, weight: 2 },
    { text: schema, weight: 1 },
    { text: serverId, weight: 1 },
    { text: `server:${serverId}`, weight: 1 },
  ];
  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    for (const field of fields) {
      if (!field.text) continue;
      if (field.text.includes(token)) score += field.weight;
    }
  }
  return score;
}

function rankByKeyword(queryTokens, descriptors) {
  if (queryTokens.length === 0) return [];
  return Array.from(descriptors)
    .map((descriptor) => ({
      descriptor,
      score: scoreByKeyword(queryTokens, descriptor),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.descriptor.name.localeCompare(b.descriptor.name),
    );
}

function dedupeByKey(list) {
  const seen = new Set();
  const deduped = [];
  for (const item of list) {
    if (!item || !item.key) continue;
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    deduped.push(item);
  }
  return deduped;
}

export class ToolRouter {
  constructor() {
    this.topK = env.TOOL_ROUTER_TOP_K;
    this.keywordMinScore = env.TOOL_ROUTER_KEYWORD_MIN_SCORE;
    this.vectorMinScore = env.TOOL_ROUTER_VECTOR_MIN_SCORE;
    this.vectorMinScoreIfNoKeyword =
      env.TOOL_ROUTER_VECTOR_MIN_SCORE_IF_NO_KEYWORD;
    this.embedTimeoutMs = env.TOOL_ROUTER_EMBED_TIMEOUT_MS;
    this.descriptorByKey = new Map();
    this.vectorStore = null;
    this.vectorEnabled = false;
    this.lastError = null;
    this.rebuildPromise = null;

    this.embeddings = new OllamaEmbeddings({
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_EMBED_MODEL,
      maxRetries: 0,
      fetch: async (input, init = {}) => {
        const timeoutController = new AbortController();
        const timer = setTimeout(
          () => timeoutController.abort(),
          this.embedTimeoutMs,
        );

        let relayAbort = null;
        if (init.signal) {
          if (init.signal.aborted) {
            timeoutController.abort();
          } else {
            relayAbort = () => timeoutController.abort();
            init.signal.addEventListener("abort", relayAbort, { once: true });
          }
        }

        try {
          return await fetch(input, {
            ...init,
            signal: timeoutController.signal,
          });
        } finally {
          clearTimeout(timer);
          if (relayAbort && init.signal) {
            init.signal.removeEventListener("abort", relayAbort);
          }
        }
      },
    });
  }

  async isEmbeddingBackendHealthy() {
    const base = String(env.OLLAMA_BASE_URL || "").replace(/\/+$/, "");
    if (!base) return false;

    try {
      const response = await fetch(`${base}/api/tags`, {
        signal: AbortSignal.timeout(this.embedTimeoutMs),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getStatus() {
    return {
      toolCount: this.descriptorByKey.size,
      vectorEnabled: this.vectorEnabled,
      topK: this.topK,
      embedModel: env.OLLAMA_EMBED_MODEL,
      embedBaseUrl: env.OLLAMA_BASE_URL,
      lastError: this.lastError,
    };
  }

  async rebuildIndex() {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this._rebuildIndexInternal().finally(() => {
      this.rebuildPromise = null;
    });
    return this.rebuildPromise;
  }

  async _rebuildIndexInternal() {
    this.lastError = null;

    const descriptors = mcpRegistry.getToolDescriptors();
    this.descriptorByKey = new Map(descriptors.map((item) => [item.key, item]));

    if (descriptors.length === 0) {
      this.vectorStore = null;
      this.vectorEnabled = false;
      return this.getStatus();
    }

    if (!(await this.isEmbeddingBackendHealthy())) {
      this.vectorStore = null;
      this.vectorEnabled = false;
      this.lastError =
        "embedding backend unavailable, fallback to keyword routing";
      return this.getStatus();
    }

    try {
      const documents = descriptors.map(
        (descriptor) =>
          new Document({
            pageContent: buildSearchText(descriptor),
            metadata: { key: descriptor.key },
          }),
      );

      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings,
      );
      this.vectorEnabled = true;
    } catch (error) {
      this.vectorStore = null;
      this.vectorEnabled = false;
      this.lastError = error instanceof Error ? error.message : String(error);
    }

    return this.getStatus();
  }

  keywordFallbackFromRanked(ranked, limit) {
    const maxScore = ranked.length > 0 ? ranked[0].score : 0;
    if (maxScore < this.keywordMinScore) return [];

    return ranked
      .filter((item) => item.score >= this.keywordMinScore)
      .slice(0, limit)
      .map((item) => item.descriptor);
  }

  keywordFallback(query, limit) {
    const queryTokens = tokenize(query);
    const ranked = rankByKeyword(queryTokens, this.descriptorByKey.values());
    return this.keywordFallbackFromRanked(ranked, limit);
  }

  async selectTools(query, limit = this.topK) {
    const maxCount = Math.max(
      1,
      Math.min(limit, this.descriptorByKey.size || 1),
    );
    if (this.descriptorByKey.size === 0) return [];

    const queryText = String(query || "").trim();
    const queryTokens = tokenize(queryText);
    const keywordRanked = rankByKeyword(
      queryTokens,
      this.descriptorByKey.values(),
    );
    const keywordMaxScore = keywordRanked.length > 0 ? keywordRanked[0].score : 0;
    const vectorMinScore =
      keywordMaxScore >= this.keywordMinScore
        ? this.vectorMinScore
        : this.vectorMinScoreIfNoKeyword;

    if (this.vectorEnabled && this.vectorStore && queryText.length > 0) {
      try {
        const selected = [];
        if (typeof this.vectorStore.similaritySearchWithScore === "function") {
          const docsWithScore =
            await this.vectorStore.similaritySearchWithScore(
              String(query),
              maxCount,
            );
          for (const [doc, score] of docsWithScore) {
            if (score < vectorMinScore) continue;
            const key = doc?.metadata?.key;
            if (!key) continue;
            const descriptor = this.descriptorByKey.get(String(key));
            if (descriptor) selected.push(descriptor);
          }
        } else {
          const docs = await this.vectorStore.similaritySearch(
            String(query),
            maxCount,
          );
          for (const doc of docs) {
            const key = doc?.metadata?.key;
            if (!key) continue;
            const descriptor = this.descriptorByKey.get(String(key));
            if (descriptor) selected.push(descriptor);
          }
        }
        if (selected.length > 0) {
          return dedupeByKey(selected).slice(0, maxCount);
        }
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    const keyword = this.keywordFallbackFromRanked(keywordRanked, maxCount);
    return dedupeByKey(keyword).slice(0, maxCount);
  }
}

export const toolRouter = new ToolRouter();
