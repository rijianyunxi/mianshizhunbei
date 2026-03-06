import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { env } from '../config/env.js';
import { createSmartSiteTools } from '../tools/smartSiteTools.js';

const AGENT_SYSTEM_PROMPT = [
  '你是“智慧工地 AI 助手”。',
  '目标：',
  '1. 优先保证施工安全与合规。',
  '2. 回答必须可执行，给出步骤、检查点和落地建议。',
  '3. 问题涉及风险评估、作业许可、班前检查、高风险工种时，优先调用工具。',
  '4. 默认输出简体中文，简洁清晰。',
].join('\n');

const MODEL_CACHE_LIMIT = 8;
const AGENT_CACHE_LIMIT = 8;
const STREAM_FALLBACK_CHUNK_SIZE = 20;

const agentMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().max(12_000),
});

const agentInputSchema = z.object({
  model: z.string().trim().min(1).max(120).optional(),
  messages: z.array(agentMessageSchema).min(1).max(48),
  sessionId: z.string().uuid().optional(),
  persistSession: z.boolean().optional().default(false),
});

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'text' in item && typeof item.text === 'string') {
          return item.text;
        }
        return '';
      })
      .join('');
  }
  return '';
}

function splitForSSE(text, maxChunk = 28) {
  const chunks = [];
  let current = '';
  for (const char of text) {
    current += char;
    if (current.length >= maxChunk) {
      chunks.push(current);
      current = '';
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function mapChatMessagesToLangChain(messages) {
  return messages.map((message) => {
    if (message.role === 'assistant') return new AIMessage(message.content);
    if (message.role === 'system') return new SystemMessage(message.content);
    return new HumanMessage(message.content);
  });
}

function extractFinalAssistantText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];

    if (message instanceof AIMessage) {
      const text = contentToText(message.content).trim();
      if (text) return text;
      continue;
    }

    if (
      message &&
      typeof message === 'object' &&
      'role' in message &&
      message.role === 'assistant' &&
      'content' in message
    ) {
      const text = contentToText(message.content).trim();
      if (text) return text;
    }
  }
  return '';
}

function extractTokenFromChunk(chunk) {
  if (typeof chunk === 'string') return chunk;
  if (Array.isArray(chunk)) return contentToText(chunk);
  if (!chunk || typeof chunk !== 'object') return '';

  if ('content' in chunk) return contentToText(chunk.content);
  if ('text' in chunk && typeof chunk.text === 'string') return chunk.text;
  return '';
}

function extractTokenFromLangGraphEvent(event) {
  if (!event || typeof event !== 'object') return '';

  const eventName = typeof event.event === 'string' ? event.event : '';
  if (eventName !== 'on_chat_model_stream' && eventName !== 'on_llm_stream') return '';

  const data = event.data && typeof event.data === 'object' ? event.data : {};
  const candidates = [data.chunk, data.delta, data.output, data.message, data];

  for (const candidate of candidates) {
    const token = extractTokenFromChunk(candidate);
    if (token) return token;
  }

  return '';
}

function extractTokenFromMessageStreamChunk(chunk) {
  const message = Array.isArray(chunk) ? chunk[0] : chunk;
  if (!message || typeof message !== 'object') return '';

  if ('type' in message && typeof message.type === 'string' && !message.type.toLowerCase().includes('ai')) {
    return '';
  }

  if ('tool_calls' in message && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    return '';
  }

  if ('content' in message) {
    return contentToText(message.content);
  }

  return '';
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function logAgentError(stage, error, meta = {}) {
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[smart-agent] ${stage}: ${getErrorMessage(error)}`, { ...meta, stack });
}

function touchCacheEntry(cache, key, value, limit) {
  if (cache.has(key)) {
    cache.delete(key);
  }
  cache.set(key, value);
  if (cache.size > limit) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  return value;
}

function parseAgentInput(rawInput) {
  const parsed = agentInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid agent input: ${details}`);
  }

  const input = parsed.data;
  const hasUserMessage = input.messages.some(
    (message) => message.role === 'user' && message.content.trim().length > 0,
  );

  if (!hasUserMessage) {
    throw new Error('Invalid agent input: at least one non-empty user message is required.');
  }

  return input;
}

class ConversationMemoryStore {
  constructor(maxHistory) {
    this.maxHistory = maxHistory;
    this.store = new Map();
  }

  get(sessionId) {
    return this.store.get(sessionId) ?? [];
  }

  append(sessionId, message) {
    const next = [...this.get(sessionId), message];
    const sliced = next.slice(-this.maxHistory);
    this.store.set(sessionId, sliced);
    return sliced;
  }
}

function createChatModel(modelName) {
  const hasCustomBaseURL = Boolean(env.OPENAI_BASE_URL);
  return new ChatOpenAI({
    model: modelName || env.OPENAI_MODEL,
    apiKey: env.OPENAI_API_KEY || (hasCustomBaseURL ? 'ollama' : ''),
    configuration: hasCustomBaseURL ? { baseURL: env.OPENAI_BASE_URL } : undefined,
    temperature: 0,
  });
}

export class SmartConstructionAgentService {
  constructor() {
    this.tools = createSmartSiteTools();
    this.memory = new ConversationMemoryStore(env.AGENT_MAX_HISTORY);
    this.modelCache = new Map();
    this.agentCache = new Map();
  }

  createSessionId() {
    return uuidv4();
  }

  getSessionHistory(sessionId) {
    return this.memory.get(sessionId);
  }

  appendSessionMessage(sessionId, message) {
    return this.memory.append(sessionId, message);
  }

  resolveModelName(modelName) {
    return modelName?.trim() || env.OPENAI_MODEL;
  }

  getOrCreateChatModel(modelName) {
    const resolvedModel = this.resolveModelName(modelName);
    const cached = this.modelCache.get(resolvedModel);
    if (cached) {
      touchCacheEntry(this.modelCache, resolvedModel, cached, MODEL_CACHE_LIMIT);
      return cached;
    }

    const created = createChatModel(resolvedModel);
    return touchCacheEntry(this.modelCache, resolvedModel, created, MODEL_CACHE_LIMIT);
  }

  getOrCreateRuntimeAgent(modelName) {
    const resolvedModel = this.resolveModelName(modelName);
    const cached = this.agentCache.get(resolvedModel);
    if (cached) {
      touchCacheEntry(this.agentCache, resolvedModel, cached, AGENT_CACHE_LIMIT);
      return cached;
    }

    const created = createReactAgent({
      llm: this.getOrCreateChatModel(resolvedModel),
      tools: this.tools,
      prompt: AGENT_SYSTEM_PROMPT,
    });

    return touchCacheEntry(this.agentCache, resolvedModel, created, AGENT_CACHE_LIMIT);
  }

  resolveMessages(input) {
    if (!input.persistSession || !input.sessionId) {
      return input.messages;
    }

    const history = this.memory.get(input.sessionId);
    return history.length > 0 ? [...history, ...input.messages] : input.messages;
  }

  persistConversationTurn(input, assistantText) {
    if (!input.persistSession || !input.sessionId) return;

    for (const message of input.messages) {
      if (message.role !== 'user') continue;
      this.memory.append(input.sessionId, {
        role: 'user',
        content: message.content,
      });
    }

    this.memory.append(input.sessionId, {
      role: 'assistant',
      content: assistantText,
    });
  }

  async generateReply(agent, messages) {
    const result = await agent.invoke({ messages });
    const text = extractFinalAssistantText(result.messages ?? []);
    return text || '未生成有效回复，请重试。';
  }

  async streamByEvents(agent, messages, onToken) {
    if (typeof agent.streamEvents !== 'function') {
      return { text: '', tokenCount: 0 };
    }

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });
    let output = '';
    let tokenCount = 0;

    for await (const event of eventStream) {
      const token = extractTokenFromLangGraphEvent(event);
      if (!token) continue;
      tokenCount += 1;
      output += token;
      if (onToken) onToken(token);
    }

    return { text: output, tokenCount };
  }

  async streamByMessagesMode(agent, messages, onToken) {
    if (typeof agent.stream !== 'function') {
      return { text: '', tokenCount: 0 };
    }

    const messageStream = await agent.stream({ messages }, { streamMode: 'messages' });
    let output = '';
    let tokenCount = 0;

    for await (const chunk of messageStream) {
      const token = extractTokenFromMessageStreamChunk(chunk);
      if (!token) continue;
      tokenCount += 1;
      output += token;
      if (onToken) onToken(token);
    }

    return { text: output, tokenCount };
  }

  async run(rawInput) {
    if (!env.OPENAI_API_KEY && !env.OPENAI_BASE_URL) {
      return {
        text: '服务已启动，但未配置 OPENAI_API_KEY，且 OPENAI_BASE_URL 为空，请在 .env 中至少配置其一后重试。',
      };
    }

    const input = parseAgentInput(rawInput);

    try {
      const agent = this.getOrCreateRuntimeAgent(input.model);
      const messages = mapChatMessagesToLangChain(this.resolveMessages(input));
      const text = await this.generateReply(agent, messages);
      this.persistConversationTurn(input, text);
      return { text };
    } catch (error) {
      logAgentError('run-failed', error, {
        sessionId: input.sessionId,
        model: this.resolveModelName(input.model),
      });
      throw error;
    }
  }

  async stream(rawInput) {
    if (!env.OPENAI_API_KEY && !env.OPENAI_BASE_URL) {
      const text =
        '服务已启动，但未配置 OPENAI_API_KEY，且 OPENAI_BASE_URL 为空，请在 .env 中至少配置其一后重试。';
      if (typeof rawInput?.onToken === 'function') {
        for (const part of splitForSSE(text, STREAM_FALLBACK_CHUNK_SIZE)) rawInput.onToken(part);
      }
      return { text };
    }

    if (rawInput?.onToken && typeof rawInput.onToken !== 'function') {
      throw new Error('Invalid agent input: onToken must be a function when provided.');
    }

    const onToken = typeof rawInput?.onToken === 'function' ? rawInput.onToken : undefined;
    const input = parseAgentInput(rawInput);

    try {
      const agent = this.getOrCreateRuntimeAgent(input.model);
      const messages = mapChatMessagesToLangChain(this.resolveMessages(input));

      try {
        const eventResult = await this.streamByEvents(agent, messages, onToken);
        if (eventResult.tokenCount > 0) {
          const text = eventResult.text.trim();
          this.persistConversationTurn(input, text);
          return { text };
        }
      } catch (error) {
        logAgentError('stream-events-failed', error, {
          sessionId: input.sessionId,
          model: this.resolveModelName(input.model),
        });
      }

      try {
        const messageStreamResult = await this.streamByMessagesMode(agent, messages, onToken);
        if (messageStreamResult.tokenCount > 0) {
          const text = messageStreamResult.text.trim();
          this.persistConversationTurn(input, text);
          return { text };
        }
      } catch (error) {
        logAgentError('stream-messages-failed', error, {
          sessionId: input.sessionId,
          model: this.resolveModelName(input.model),
        });
      }

      const text = await this.generateReply(agent, messages);
      if (onToken) {
        for (const part of splitForSSE(text, STREAM_FALLBACK_CHUNK_SIZE)) {
          onToken(part);
        }
      }

      this.persistConversationTurn(input, text);
      return { text };
    } catch (error) {
      logAgentError('stream-failed', error, {
        sessionId: input.sessionId,
        model: this.resolveModelName(input.model),
      });
      throw error;
    }
  }
}

export const smartConstructionAgent = new SmartConstructionAgentService();
