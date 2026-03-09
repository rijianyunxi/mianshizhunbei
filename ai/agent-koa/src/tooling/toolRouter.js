import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { OllamaEmbeddings } from '@langchain/ollama';
import { env } from '../config/env.js';
import { mcpRegistry } from '../mcp/mcpRegistry.js';

const BROWSER_INTENT_REGEX =
  /(https?:\/\/|www\.|打开.*(网站|网页)|访问.*(网站|网页)|浏览(器|网页)|网页|网址|链接|url|website|web\s*page|open\s+.*(url|site|website))/i;
const BROWSER_HINTS = ['chrome', 'devtools', 'browser', 'page', 'tab', 'url', 'navigate', 'screenshot'];
const BROWSER_CORE_TOOL_REGEX =
  /(new[_-]?page|navigate[_-]?page|list[_-]?pages|select[_-]?page|open|goto|go[_-]?to|visit)/i;

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildSearchText(descriptor) {
  return [
    descriptor.name,
    descriptor.description,
    JSON.stringify(descriptor.inputSchema || {}),
    `server:${descriptor.serverId}`,
  ].join('\n');
}

function scoreByKeyword(queryTokens, descriptor) {
  if (queryTokens.length === 0) return 0;
  const haystack = buildSearchText(descriptor).toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

function isBrowserIntent(query) {
  return BROWSER_INTENT_REGEX.test(String(query || '').trim());
}

function scoreBrowserHints(descriptor) {
  const haystack = buildSearchText(descriptor).toLowerCase();
  let score = 0;
  for (const hint of BROWSER_HINTS) {
    if (haystack.includes(hint)) score += 1;
  }
  if (BROWSER_CORE_TOOL_REGEX.test(String(descriptor.name || ''))) {
    score += 100;
  }
  return score;
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
    this.embedTimeoutMs = env.TOOL_ROUTER_EMBED_TIMEOUT_MS;
    this.descriptorByKey = new Map();
    this.vectorStore = null;
    this.vectorEnabled = false;
    this.lastError = null;

    this.embeddings = new OllamaEmbeddings({
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_EMBED_MODEL,
      maxRetries: 0,
      fetch: async (input, init = {}) => {
        const timeoutController = new AbortController();
        const timer = setTimeout(() => timeoutController.abort(), this.embedTimeoutMs);

        let relayAbort = null;
        if (init.signal) {
          if (init.signal.aborted) {
            timeoutController.abort();
          } else {
            relayAbort = () => timeoutController.abort();
            init.signal.addEventListener('abort', relayAbort, { once: true });
          }
        }

        try {
          return await fetch(input, { ...init, signal: timeoutController.signal });
        } finally {
          clearTimeout(timer);
          if (relayAbort && init.signal) {
            init.signal.removeEventListener('abort', relayAbort);
          }
        }
      },
    });
  }

  async isEmbeddingBackendHealthy() {
    const base = String(env.OLLAMA_BASE_URL || '').replace(/\/+$/, '');
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
      this.lastError = 'embedding backend unavailable, fallback to keyword routing';
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

      this.vectorStore = await MemoryVectorStore.fromDocuments(documents, this.embeddings);
      this.vectorEnabled = true;
    } catch (error) {
      this.vectorStore = null;
      this.vectorEnabled = false;
      this.lastError = error instanceof Error ? error.message : String(error);
    }

    return this.getStatus();
  }

  keywordFallback(query, limit) {
    const queryTokens = tokenize(query);
    const ranked = Array.from(this.descriptorByKey.values())
      .map((descriptor) => ({ descriptor, score: scoreByKeyword(queryTokens, descriptor) }))
      .sort((a, b) => b.score - a.score || a.descriptor.name.localeCompare(b.descriptor.name));

    return ranked.slice(0, limit).map((item) => item.descriptor);
  }

  browserIntentFallback(limit) {
    const ranked = Array.from(this.descriptorByKey.values())
      .map((descriptor) => ({ descriptor, score: scoreBrowserHints(descriptor) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.descriptor.name.localeCompare(b.descriptor.name));

    return ranked.slice(0, limit).map((item) => item.descriptor);
  }

  async selectTools(query, limit = this.topK) {
    const browserIntent = isBrowserIntent(query);
    const desired = browserIntent ? Math.max(limit, 6) : limit;
    const maxCount = Math.max(1, Math.min(desired, this.descriptorByKey.size || 1));
    if (this.descriptorByKey.size === 0) return [];

    const browserCandidates = browserIntent ? this.browserIntentFallback(maxCount) : [];
    if (browserCandidates.length >= maxCount) {
      return browserCandidates.slice(0, maxCount);
    }

    if (this.vectorEnabled && this.vectorStore && String(query || '').trim().length > 0) {
      try {
        const docs = await this.vectorStore.similaritySearch(String(query), maxCount);
        const selected = [];
        for (const doc of docs) {
          const key = doc?.metadata?.key;
          if (!key) continue;
          const descriptor = this.descriptorByKey.get(String(key));
          if (descriptor) selected.push(descriptor);
        }
        if (selected.length > 0) {
          return dedupeByKey([...browserCandidates, ...selected]).slice(0, maxCount);
        }
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    const keyword = this.keywordFallback(query, maxCount);
    return dedupeByKey([...browserCandidates, ...keyword]).slice(0, maxCount);
  }
}

export const toolRouter = new ToolRouter();
