import { DynamicStructuredTool } from '@langchain/core/tools';
import { createAgent } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { env } from '../config/env.js';
import { mcpRegistry } from '../mcp/mcpRegistry.js';
import { checkpointSaver, clearThreadCheckpoints } from '../persistence/checkpointer.js';
import { toolRouter } from '../tooling/toolRouter.js';
import { jsonSchemaToZod, normalizeRole, splitText } from '../utils/schema.js';

const AGENT_SYSTEM_PROMPT = [
  '你是“智慧工地 AI 调度助手”。',
  '你的任务：',
  '1. 优先保证施工安全和合规。',
  '2. 输出结构化、可执行的步骤和检查项。',
  '3. 必要时主动调用工具，不要凭空编造现场数据。',
  '4. 默认使用简体中文，表达简洁清晰。',
  '5. 工具调用遵循“能力感知 + 按需最小化”原则：仅在当前已启用工具能直接解决问题时调用对应工具。',
  '6. 若用户请求涉及外部操作（如网页、设备、数据系统），先判断是否存在匹配工具；有则执行，无则明确说明缺失能力并给出替代方案。',
].join('\n');

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(20000),
});

const inputSchema = z.object({
  threadId: z.string().optional(),
  messages: z.array(messageSchema).min(1),
  persistThread: z.boolean().optional().default(true),
});

function withTimeout(promise, timeoutMs, label) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`工具调用超时(${timeoutMs}ms): ${label}`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer !== null) clearTimeout(timer);
  });
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && typeof item.text === 'string') return item.text;
      return '';
    })
    .join('');
}

function extractFinalAssistantText(messages) {
  if (!Array.isArray(messages)) return '';
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    const role =
      typeof msg?.getType === 'function'
        ? msg.getType()
        : typeof msg?._getType === 'function'
          ? msg._getType()
          : msg?.role;

    if (role === 'ai' || role === 'assistant') {
      const text = contentToText(msg?.content).trim();
      if (text) return text;
    }
  }
  return '';
}

function extractLatestUserQuery(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role === 'user') {
      return message.content;
    }
  }
  return '';
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const sanitized = [];

  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const role = normalizeRole(message.role);
    const content = String(message.content ?? '').trim();
    if (!content) continue;
    sanitized.push({ role, content });
  }

  return sanitized;
}

function buildSlidingWindow(messages) {
  const normalized = sanitizeMessages(messages);

  if (normalized.length === 0) {
    return [{ role: 'system', content: AGENT_SYSTEM_PROMPT }];
  }

  const firstSystem = normalized.find((message) => message.role === 'system');
  const nonSystem = normalized.filter((message) => message.role !== 'system');
  const keepCount = Math.max(2, env.AGENT_CONTEXT_ROUNDS * 2);
  const recent = nonSystem.slice(-keepCount);

  const systemMessage = firstSystem || { role: 'system', content: AGENT_SYSTEM_PROMPT };
  return [systemMessage, ...recent];
}

function createModel() {
  const hasCustomBaseUrl = Boolean(env.OPENAI_BASE_URL);
  return new ChatOpenAI({
    model: env.OPENAI_MODEL,
    apiKey: env.OPENAI_API_KEY || (hasCustomBaseUrl ? 'sk-local' : ''),
    configuration: hasCustomBaseUrl ? { baseURL: env.OPENAI_BASE_URL } : undefined,
    temperature: 0.2,
  });
}

function extractToolNameFromEvent(event) {
  const candidates = [event?.name, event?.data?.name, event?.data?.tool?.name, event?.data?.input?.name];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) return item;
  }
  return 'unknown_tool';
}

function buildToolEventPayload(event, selectedTools) {
  const runtimeName = extractToolNameFromEvent(event);
  const descriptor = selectedTools.find((item) => item.runtimeName === runtimeName);

  return {
    name: descriptor ? `${descriptor.serverId}/${descriptor.name}` : runtimeName,
    runtimeName,
    serverId: descriptor?.serverId,
    toolName: descriptor?.name || runtimeName,
    input: event?.data?.input,
  };
}

function extractTokenFromEvent(event) {
  const eventName = String(event?.event || '');
  if (eventName !== 'on_chat_model_stream' && eventName !== 'on_llm_stream') {
    return '';
  }

  const candidates = [event?.data?.chunk, event?.data?.delta, event?.data?.output, event?.data?.message];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string') return candidate;
    const text = contentToText(candidate?.content);
    if (text) return text;
  }

  return '';
}

function errorToMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function isInvalidMessageRoleError(error) {
  const message = errorToMessage(error);
  if (!message) return false;
  if (/Unknown message role/i.test(message)) return true;
  if (/is not one of \['system', 'assistant', 'user', 'tool', 'function'\]/i.test(message)) return true;
  if (/messages\.\[\d+\]\.role/i.test(message)) return true;
  return false;
}

function shouldRecoverFromMessageRoleError(error, input) {
  const threadId = typeof input?.threadId === 'string' ? input.threadId.trim() : '';
  return Boolean(input?.persistThread && threadId && isInvalidMessageRoleError(error));
}

class SmartConstructionAgentService {
  createThreadId() {
    return uuidv4();
  }

  validateOrThrow(rawInput) {
    const parsed = inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      throw new Error(`Invalid agent input: ${details}`);
    }

    const hasUser = parsed.data.messages.some((message) => message.role === 'user' && message.content.trim());
    if (!hasUser) {
      throw new Error('Invalid agent input: at least one user message is required.');
    }

    return parsed.data;
  }

  async buildRuntime(rawInput) {
    const input = this.validateOrThrow(rawInput);

    if (!env.OPENAI_API_KEY && !env.OPENAI_BASE_URL) {
      return {
        input,
        errorText: '服务已启动，但未配置 OPENAI_API_KEY 且 OPENAI_BASE_URL 为空，请至少配置其中一个。',
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
            const message = error instanceof Error ? error.message : String(error);
            return `工具调用失败(${descriptor.serverId}/${descriptor.name}): ${message}`;
          }
        },
      });
    });

    const agent = createAgent({
      model: createModel(),
      tools,
      systemPrompt: AGENT_SYSTEM_PROMPT,
      checkpointer: input.persistThread && input.threadId ? checkpointSaver : undefined,
    });

    const messages = buildSlidingWindow(input.messages);
    const config = {
      recursionLimit: env.AGENT_MAX_ITERATIONS,
      configurable: input.persistThread && input.threadId ? { thread_id: input.threadId } : undefined,
    };

    return {
      input,
      agent,
      config,
      messages,
      selectedTools,
    };
  }

  async run(rawInput) {
    const runtime = await this.buildRuntime(rawInput);
    if (runtime.errorText) {
      return {
        text: runtime.errorText,
        selectedTools: [],
      };
    }

    let result;
    try {
      result = await runtime.agent.invoke({ messages: runtime.messages }, runtime.config);
    } catch (error) {
      if (!shouldRecoverFromMessageRoleError(error, runtime.input)) {
        throw error;
      }

      console.warn(
        `[agent] message role corrupted, reset checkpoint and retry once. thread_id=${runtime.input.threadId}; error=${errorToMessage(error)}`,
      );
      await clearThreadCheckpoints(runtime.input.threadId);
      const retryRuntime = await this.buildRuntime(runtime.input);
      result = await retryRuntime.agent.invoke({ messages: retryRuntime.messages }, retryRuntime.config);

      return {
        text: extractFinalAssistantText(result?.messages) || '未生成有效回复，请重试。',
        selectedTools: retryRuntime.selectedTools,
      };
    }

    const text = extractFinalAssistantText(result?.messages) || '未生成有效回复，请重试。';

    return {
      text,
      selectedTools: runtime.selectedTools,
    };
  }

  async stream(rawInput) {
    const onToken = typeof rawInput?.onToken === 'function' ? rawInput.onToken : undefined;
    const onToolStart = typeof rawInput?.onToolStart === 'function' ? rawInput.onToolStart : undefined;
    const onToolEnd = typeof rawInput?.onToolEnd === 'function' ? rawInput.onToolEnd : undefined;

    const runtime = await this.buildRuntime(rawInput);
 
    if (runtime.errorText) {
      if (onToken) {
        for (const part of splitText(runtime.errorText, 20)) onToken(part);
      }
      return {
        text: runtime.errorText,
        selectedTools: [],
      };
    }

    const streamOnce = async (activeRuntime) => {
      const controller = new AbortController();
      const config = {
        ...activeRuntime.config,
        signal: controller.signal,
        version: 'v2',
      };

      let output = '';
      let tokenCount = 0;
      let toolCallCount = 0;
      let activeToolCalls = 0;
      let finalTextFromEvents = '';

      const stream = await activeRuntime.agent.streamEvents({ messages: activeRuntime.messages }, config);

      for await (const event of stream) {
        const eventName = String(event?.event || '');

        if (eventName === 'on_tool_start') {
          toolCallCount += 1;
          activeToolCalls += 1;
          const toolEvent = buildToolEventPayload(event, activeRuntime.selectedTools);
          if (onToolStart) onToolStart(toolEvent);

          if (toolCallCount > env.AGENT_TOOL_MAX_CALLS) {
            controller.abort();
            throw new Error(`Tool call limit exceeded: ${env.AGENT_TOOL_MAX_CALLS}`);
          }
        }

        if (eventName === 'on_tool_end') {
          activeToolCalls = Math.max(0, activeToolCalls - 1);
          const toolEvent = buildToolEventPayload(event, activeRuntime.selectedTools);
          if (onToolEnd) onToolEnd(toolEvent);
        }

        if (eventName === 'on_chain_end') {
          const maybeMessages = event?.data?.output?.messages;
          const maybeText = extractFinalAssistantText(maybeMessages);
          if (maybeText) {
            finalTextFromEvents = maybeText;
          }
        }

        if (activeToolCalls > 0 && (eventName === 'on_chat_model_stream' || eventName === 'on_llm_stream')) {
          continue;
        }

        const token = extractTokenFromEvent(event);
        if (!token) continue;
        tokenCount += 1;
        output += token;
        if (onToken) onToken(token);
      }

      if (tokenCount > 0) {
        return {
          text: output.trim(),
          selectedTools: activeRuntime.selectedTools,
        };
      }

      if (finalTextFromEvents) {
        if (onToken) {
          for (const part of splitText(finalTextFromEvents, 20)) onToken(part);
        }
        return {
          text: finalTextFromEvents,
          selectedTools: activeRuntime.selectedTools,
        };
      }

      throw new Error('模型响应流中断：未接收到有效内容。');
    };

    try {
      return await streamOnce(runtime);
    } catch (error) {
      if (!shouldRecoverFromMessageRoleError(error, runtime.input)) {
        throw error;
      }

      console.warn(
        `[agent] message role corrupted, reset checkpoint and retry once(stream). thread_id=${runtime.input.threadId}; error=${errorToMessage(error)}`,
      );
      await clearThreadCheckpoints(runtime.input.threadId);
      const retryRuntime = await this.buildRuntime(runtime.input);
      return streamOnce(retryRuntime);
    }
  }
}

export const smartConstructionAgent = new SmartConstructionAgentService();
