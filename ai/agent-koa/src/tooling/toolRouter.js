import { createToolRouter } from '../../../agent-core/src/tooling/toolRouter.js';
import { env } from '../config/env.js';
import { mcpRegistry } from '../mcp/mcpRegistry.js';

export const toolRouter = createToolRouter({
  registry: mcpRegistry,
  topK: env.TOOL_ROUTER_TOP_K,
  keywordMinScore: env.TOOL_ROUTER_KEYWORD_MIN_SCORE,
  vectorMinScore: env.TOOL_ROUTER_VECTOR_MIN_SCORE,
  vectorMinScoreIfNoKeyword: env.TOOL_ROUTER_VECTOR_MIN_SCORE_IF_NO_KEYWORD,
  embedTimeoutMs: env.TOOL_ROUTER_EMBED_TIMEOUT_MS,
  embedBaseUrl: env.OLLAMA_BASE_URL,
  embedModel: env.OLLAMA_EMBED_MODEL,
});
