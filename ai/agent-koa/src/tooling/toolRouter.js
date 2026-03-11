import { OllamaEmbeddings } from "@langchain/ollama";
import { env } from "../config/env.js";
import { mcpRegistry } from "../mcp/mcpRegistry.js";
// 引入刚刚拆分出来的关键字类
import { KeywordSearch } from "./KeywordSearch.js"; 

/**
 * 组装工具的检索文本 (供大模型生成向量使用)
 * @param {Object} descriptor - 工具描述对象
 * @returns {string} 纯文本字符串
 */
function buildSearchText(descriptor) {
  return [
    descriptor.name,
    descriptor.description,
    JSON.stringify(descriptor.inputSchema || {}),
    `server:${descriptor.serverId}`,
  ].join("\n");
}

/**
 * 计算两个向量的余弦相似度
 * @param {number[]} vecA - 向量 A
 * @param {number[]} vecB - 向量 B
 * @returns {number} 相似度得分
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class ToolRouter {
  /**
   * 初始化智能调度路由器
   */
  constructor() {
    this.topK = env.TOOL_ROUTER_TOP_K;
    this.vectorMinScore = env.TOOL_ROUTER_VECTOR_MIN_SCORE;
    this.vectorMinScoreIfNoKeyword = env.TOOL_ROUTER_VECTOR_MIN_SCORE_IF_NO_KEYWORD;
    this.embedTimeoutMs = env.TOOL_ROUTER_EMBED_TIMEOUT_MS;
    
    // 初始化关键字检索引擎
    this.keywordSearch = new KeywordSearch(env.TOOL_ROUTER_KEYWORD_MIN_SCORE);
    
    this.descriptorByKey = new Map();
    this.nativeVectorStore = null; 
    this.vectorEnabled = false;
    this.lastError = null;
    this.rebuildPromise = null;

    this.embeddings = new OllamaEmbeddings({
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_EMBED_MODEL,
      maxRetries: 0,
      fetch: async (input, init = {}) => {
        // ... 此处的超时 fetch 逻辑保持不变 ...
        const timeoutController = new AbortController();
        const timer = setTimeout(() => timeoutController.abort(), this.embedTimeoutMs);
        let relayAbort = null;
        if (init.signal) {
          if (init.signal.aborted) timeoutController.abort();
          else {
            relayAbort = () => timeoutController.abort();
            init.signal.addEventListener("abort", relayAbort, { once: true });
          }
        }
        try {
          return await fetch(input, { ...init, signal: timeoutController.signal });
        } finally {
          clearTimeout(timer);
          if (relayAbort && init.signal) init.signal.removeEventListener("abort", relayAbort);
        }
      },
    });
  }

  async isEmbeddingBackendHealthy() {
    const base = String(env.OLLAMA_BASE_URL || "").replace(/\/+$/, "");
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
      embedModel: env.OLLAMA_EMBED_MODEL,
      embedBaseUrl: env.OLLAMA_BASE_URL,
      lastError: this.lastError,
    };
  }

  async rebuildIndex() {
    if (this.rebuildPromise) return this.rebuildPromise;
    this.rebuildPromise = this._rebuildIndexInternal().finally(() => { this.rebuildPromise = null; });
    return this.rebuildPromise;
  }

  async _rebuildIndexInternal() {
    this.lastError = null;
    const descriptors = mcpRegistry.getToolDescriptors();
    this.descriptorByKey = new Map(descriptors.map((item) => [item.key, item]));

    if (descriptors.length === 0) {
      this.nativeVectorStore = null;
      this.vectorEnabled = false;
      return this.getStatus();
    }

    if (!(await this.isEmbeddingBackendHealthy())) {
      this.nativeVectorStore = null;
      this.vectorEnabled = false;
      this.lastError = "embedding backend unavailable, fallback to keyword routing";
      return this.getStatus();
    }

    try {
      const texts = descriptors.map(desc => buildSearchText(desc));
      const vectors = await this.embeddings.embedDocuments(texts);
      this.nativeVectorStore = descriptors.map((desc, i) => ({
        descriptor: desc,
        vector: vectors[i] 
      }));
      this.vectorEnabled = true;
    } catch (error) {
      this.nativeVectorStore = null;
      this.vectorEnabled = false;
      this.lastError = error instanceof Error ? error.message : String(error);
    }
    return this.getStatus();
  }

  /**
   * 核心分发枢纽：混合检索
   */
  async selectTools(query, limit = this.topK) {
    const maxCount = Math.max(1, Math.min(limit, this.descriptorByKey.size || 1));
    if (this.descriptorByKey.size === 0) return [];

    const queryText = String(query || "").trim();
    
    // 1. 调用提取出的类，获取关键字打分结果
    const queryTokens = this.keywordSearch.tokenize(queryText);
    const keywordRanked = this.keywordSearch.rank(queryTokens, this.descriptorByKey.values());
    const keywordMaxScore = keywordRanked.length > 0 ? keywordRanked[0].score : 0;
    
    const vectorMinScore = keywordMaxScore >= this.keywordSearch.minScore
        ? this.vectorMinScore
        : this.vectorMinScoreIfNoKeyword;

    // 2. 向量检索主干道
    if (this.vectorEnabled && this.nativeVectorStore && queryText.length > 0) {
      try {
        const selected = [];
        const queryVector = await this.embeddings.embedQuery(queryText);
        
        const scoredDocs = this.nativeVectorStore.map(item => ({
          descriptor: item.descriptor,
          score: cosineSimilarity(queryVector, item.vector)
        }));
        
        scoredDocs.sort((a, b) => b.score - a.score);

        for (const item of scoredDocs) {
          if (item.score < vectorMinScore) continue;
          selected.push(item.descriptor);
          if (selected.length >= maxCount) break;
        }

        if (selected.length > 0) {
          // 复用提取出的通用去重方法
          return this.keywordSearch.dedupeByKey(selected);
        }
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    // 3. 兜底策略：调用提取出的关键字回退方法
    const keyword = this.keywordSearch.fallbackFromRanked(keywordRanked, maxCount);
    return this.keywordSearch.dedupeByKey(keyword).slice(0, maxCount);
  }
}

export const toolRouter = new ToolRouter();