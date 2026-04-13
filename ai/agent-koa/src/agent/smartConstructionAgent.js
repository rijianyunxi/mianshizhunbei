import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import {
  AGENT_DEFAULT_SYSTEM_PROMPT,
  CoreAgentService,
  describeAgentError,
  extractLatestUserQuery,
  withTimeout,
} from '../../../agent-core/src/index.js';
import { env } from '../config/env.js';
import { mcpRegistry } from '../mcp/mcpRegistry.js';
import { checkpointSaver, clearThreadCheckpoints } from '../persistence/checkpointer.js';
import { toolRouter } from '../tooling/toolRouter.js';
import { jsonSchemaToZod } from '../utils/schema.js';

function createModel() {
  const hasCustomBaseUrl = Boolean(env.OPENAI_BASE_URL);
  return new ChatOpenAI({
    model: env.OPENAI_MODEL,
    apiKey: env.OPENAI_API_KEY || (hasCustomBaseUrl ? 'sk-local' : ''),
    configuration: hasCustomBaseUrl ? { baseURL: env.OPENAI_BASE_URL } : undefined,
    temperature: 0.2,
  });
}

async function buildLangChainRuntime({ input, messages, systemPrompt, maxIterations }) {
  if (!env.OPENAI_API_KEY && !env.OPENAI_BASE_URL) {
    return {
      errorText: '服务已启动，但未配置 OPENAI_API_KEY 且 OPENAI_BASE_URL 为空，请至少配置其中一个。',
      selectedTools: [],
    };
  }

  const query = extractLatestUserQuery(input.messages);
  const selectedTools = await toolRouter.selectTools(query, env.TOOL_ROUTER_TOP_K);

  const tools = selectedTools.map((descriptor) => {
    const schema = jsonSchemaToZod(descriptor.inputSchema);
    return new DynamicStructuredTool({
      name: descriptor.runtimeName,
      description: `[MCP/${descriptor.serverId}/${descriptor.name}] ${descriptor.description || 'No description'}`,
      schema,
      func: async (args) => {
        try {
          const label = `${descriptor.serverId}/${descriptor.name}`;
          const result = await withTimeout(
            mcpRegistry.callTool(descriptor.serverId, descriptor.name, args || {}),
            env.AGENT_TOOL_TIMEOUT_MS,
            label,
          );
          return result.text;
        } catch (error) {
          return `工具调用失败(${descriptor.serverId}/${descriptor.name}): ${describeAgentError(error)}`;
        }
      },
    });
  });

  const agent = createAgent({
    model: createModel(),
    tools,
    systemPrompt,
    checkpointer: input.persistThread && input.threadId ? checkpointSaver : undefined,
  });

  return {
    agent,
    config: {
      recursionLimit: maxIterations,
      configurable: input.persistThread && input.threadId ? { thread_id: input.threadId } : undefined,
    },
    messages,
    selectedTools,
  };
}

async function recoverRuntimeState({ input, error, mode }) {
  if (!input?.threadId) return;

  const suffix = mode === 'stream' ? '(stream)' : '';
  console.warn(
    `[agent] message role corrupted, reset checkpoint and retry once${suffix}. thread_id=${input.threadId}; error=${describeAgentError(error)}`,
  );
  await clearThreadCheckpoints(input.threadId);
}

export const smartConstructionAgent = new CoreAgentService({
  systemPrompt: AGENT_DEFAULT_SYSTEM_PROMPT,
  contextRounds: env.AGENT_CONTEXT_ROUNDS,
  maxIterations: env.AGENT_MAX_ITERATIONS,
  maxToolCalls: env.AGENT_TOOL_MAX_CALLS,
  buildRuntime: buildLangChainRuntime,
  recoverRuntimeState,
});
