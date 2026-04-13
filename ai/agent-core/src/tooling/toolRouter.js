import { OllamaEmbeddings } from '../../../agent-koa/node_modules/@langchain/ollama/dist/embeddings.js';
import { KeywordSearch } from './KeywordSearch.js';

function buildSearchText(descriptor) {
  let paramsDesc = 'none';
  if (descriptor.inputSchema && descriptor.inputSchema.properties) {
    paramsDesc = Object.keys(descriptor.inputSchema.properties).join(', ') || 'none';
  }

  return [
    `Tool name: ${descriptor.name}`,
    `Description: ${descriptor.description || ''}`,
    `Parameters: ${paramsDesc}`,
  ].join('. ');
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < vecA.length; index += 1) {
    dotProduct += vecA[index] * vecB[index];
    normA += vecA[index] * vecA[index];
    normB += vecB[index] * vecB[index];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class ToolRouter {
  constructor(options) {
    this.registry = options.registry;
    this.topK = options.topK;
    this.vectorMinScore = options.vectorMinScore;
    this.vectorMinScoreIfNoKeyword = options.vectorMinScoreIfNoKeyword;
    this.embedTimeoutMs = options.embedTimeoutMs;
    this.embedBaseUrl = options.embedBaseUrl;
    this.embedModel = options.embedModel;
    this.keywordSearch = new KeywordSearch(options.keywordMinScore);
    this.descriptorByKey = new Map();
    this.nativeVectorStore = null;
    this.vectorEnabled = false;
    this.lastError = null;
    this.rebuildPromise = null;

    this.embeddings = new OllamaEmbeddings({
      baseUrl: this.embedBaseUrl,
      model: this.embedModel,
      maxRetries: 0,
      fetch: async (input, init = {}) => {
        const timeoutController = new AbortController();
        const timer = setTimeout(() => timeoutController.abort(), this.embedTimeoutMs);
        let relayAbort = null;
        if (init.signal) {
          if (init.signal.aborted) timeoutController.abort();
          else {
            relayAbort = () => timeoutController.abort();
            init.signal.addEventListener('abort', relayAbort, { once: true });
          }
        }
        try {
          return await fetch(input, { ...init, signal: timeoutController.signal });
        } finally {
          clearTimeout(timer);
          if (relayAbort && init.signal) init.signal.removeEventListener('abort', relayAbort);
        }
      },
    });
  }

  async isEmbeddingBackendHealthy() {
    const base = String(this.embedBaseUrl || '').replace(/\/+$/, '');
    if (!base) return false;
    try {
      const response = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(this.embedTimeoutMs) });
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
      embedModel: this.embedModel,
      embedBaseUrl: this.embedBaseUrl,
      lastError: this.lastError,
    };
  }

  async rebuildIndex() {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this.#rebuildIndexInternal().finally(() => {
      this.rebuildPromise = null;
    });
    return this.rebuildPromise;
  }

  async #rebuildIndexInternal() {
    this.lastError = null;
    const descriptors = this.registry.getToolDescriptors();
    this.descriptorByKey = new Map(descriptors.map((item) => [item.key, item]));

    if (descriptors.length === 0) {
      this.nativeVectorStore = null;
      this.vectorEnabled = false;
      return this.getStatus();
    }

    if (!(await this.isEmbeddingBackendHealthy())) {
      this.nativeVectorStore = null;
      this.vectorEnabled = false;
      this.lastError = 'embedding backend unavailable, fallback to keyword routing';
      return this.getStatus();
    }

    try {
      const texts = descriptors.map((descriptor) => buildSearchText(descriptor));
      const vectors = await this.embeddings.embedDocuments(texts);
      this.nativeVectorStore = descriptors.map((descriptor, index) => ({ descriptor, vector: vectors[index] }));
      this.vectorEnabled = true;
    } catch (error) {
      this.nativeVectorStore = null;
      this.vectorEnabled = false;
      this.lastError = error instanceof Error ? error.message : String(error);
    }

    return this.getStatus();
  }

  async selectTools(query, limit = this.topK) {
    const maxCount = Math.max(1, Math.min(limit, this.descriptorByKey.size || 1));
    if (this.descriptorByKey.size === 0) return [];

    const queryText = String(query || '').trim();
    const queryTokens = this.keywordSearch.tokenize(queryText);
    const keywordRanked = this.keywordSearch.rank(queryTokens, this.descriptorByKey.values());
    const keywordMaxScore = keywordRanked.length > 0 ? keywordRanked[0].score : 0;

    const vectorMinScore = keywordMaxScore >= this.keywordSearch.minScore
      ? this.vectorMinScore
      : this.vectorMinScoreIfNoKeyword;

    if (this.vectorEnabled && this.nativeVectorStore && queryText.length > 0) {
      try {
        const selected = [];
        const queryVector = await this.embeddings.embedQuery(queryText);
        const scoredDocs = this.nativeVectorStore.map((item) => ({
          descriptor: item.descriptor,
          score: cosineSimilarity(queryVector, item.vector),
        }));

        scoredDocs.sort((a, b) => b.score - a.score);

        for (const item of scoredDocs) {
          if (item.score < vectorMinScore) continue;
          selected.push(item.descriptor);
          if (selected.length >= maxCount) break;
        }

        if (selected.length > 0) {
          return this.keywordSearch.dedupeByKey(selected);
        }
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    const keyword = this.keywordSearch.fallbackFromRanked(keywordRanked, maxCount);
    return this.keywordSearch.dedupeByKey(keyword).slice(0, maxCount);
  }
}

export function createToolRouter(options) {
  return new ToolRouter(options);
}

