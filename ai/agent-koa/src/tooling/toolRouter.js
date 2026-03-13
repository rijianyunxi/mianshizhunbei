import { OllamaEmbeddings } from "@langchain/ollama";
import { env } from "../config/env.js";
import { mcpRegistry } from "../mcp/mcpRegistry.js";
// 引入刚刚拆分出来的关键字类
import { KeywordSearch } from "./KeywordSearch.js"; 

/**
 * [🚀 核心优化]：重写组装逻辑，消除 JSON 噪音，增强自然语言语义
 * 避免模型因为 "type", "string", "object" 等通用词汇产生错误的相似度
 * @param {Object} descriptor - 工具描述对象
 * @returns {string} 纯文本字符串
 */
function buildSearchText(descriptor) {
  // 1. 提取参数名称和描述，丢弃 JSON 结构噪音
  let paramsDesc = "无";
  if (descriptor.inputSchema && descriptor.inputSchema.properties) {
    const props = descriptor.inputSchema.properties;
    // 提取所有参数的 key，如果参数本身有 description 也可以一并加上
    paramsDesc = Object.keys(props).join(", ");
  }

  // 2. 使用结构化的自然语言模板拼接
  // 注意：去掉了 serverId，因为它属于系统标识，通常对理解工具"用途"没有语义帮助
  const parts = [
    `工具名称: ${descriptor.name}`,
    `功能描述: ${descriptor.description}`,
    `接收参数: ${paramsDesc}`
  ];

  return parts.join("。");
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
        console.log(`[得分透视] "${queryText}" 的匹配分数:`, scoredDocs.map(d => `${d.descriptor.name}: ${d.score.toFixed(4)}`));
        // [🚀 调试辅助] 如果你需要排查为什么匹配到了奇怪的工具，可以取消下面这行的注释查看所有工具的分数：
        // console.log("向量检索打分结果:", scoredDocs.map(d => ({ name: d.descriptor.name, score: d.score.toFixed(4) })));

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