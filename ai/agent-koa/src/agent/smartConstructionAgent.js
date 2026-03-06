import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { createSmartSiteTools } from '../tools/smartSiteTools.js';

const AGENT_SYSTEM_PROMPT = [
  '\u4f60\u662f\u201c\u667a\u6167\u5de5\u5730 AI \u52a9\u624b\u201d\u3002',
  '\u76ee\u6807\uff1a',
  '1. \u4f18\u5148\u4fdd\u8bc1\u65bd\u5de5\u5b89\u5168\u4e0e\u5408\u89c4\u3002',
  '2. \u56de\u7b54\u5fc5\u987b\u53ef\u6267\u884c\uff0c\u7ed9\u51fa\u6b65\u9aa4\u3001\u68c0\u67e5\u70b9\u548c\u843d\u5730\u5efa\u8bae\u3002',
  '3. \u95ee\u9898\u6d89\u53ca\u98ce\u9669\u8bc4\u4f30\u3001\u4f5c\u4e1a\u8bb8\u53ef\u3001\u73ed\u524d\u68c0\u67e5\u3001\u9ad8\u98ce\u9669\u5de5\u79cd\u65f6\uff0c\u4f18\u5148\u8c03\u7528\u5de5\u5177\u3002',
  '4. \u9ed8\u8ba4\u8f93\u51fa\u7b80\u4f53\u4e2d\u6587\uff0c\u7b80\u6d01\u6e05\u6670\u3002',
].join('\n');

const FINAL_STREAM_PROMPT =
  '\u8bf7\u57fa\u4e8e\u5f53\u524d\u5bf9\u8bdd\u4e0e\u5de5\u5177\u7ed3\u679c\uff0c\u7ed9\u51fa\u6700\u7ec8\u56de\u7b54\u3002\u8981\u6c42\uff1a\u7ed3\u6784\u5316\u3001\u53ef\u6267\u884c\u3001\u7b80\u4f53\u4e2d\u6587\u3002';

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

function mapChatMessagesToLangChain(messages) {
  return messages.map((message) => {
    if (message.role === 'assistant') return new AIMessage(message.content);
    if (message.role === 'system') return new SystemMessage(message.content);
    return new HumanMessage(message.content);
  });
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
  return new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    model: modelName || env.OPENAI_MODEL,
    configuration: env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : undefined,
    temperature: 0.2,
  });
}

export class SmartConstructionAgentService {
  constructor() {
    this.tools = createSmartSiteTools();
    this.toolMap = new Map(this.tools.map((tool) => [tool.name, tool]));
    this.memory = new ConversationMemoryStore(env.AGENT_MAX_HISTORY);
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

  async resolveToolContext(messages, modelName) {
    const chatModel = createChatModel(modelName);
    const callable = chatModel.bindTools(this.tools);
    const working = [new SystemMessage(AGENT_SYSTEM_PROMPT), ...mapChatMessagesToLangChain(messages)];

    for (let step = 0; step < 6; step += 1) {
      const ai = await callable.invoke(working);
      const toolCalls = ai.tool_calls ?? [];

      if (toolCalls.length === 0) {
        return { working, directAnswer: contentToText(ai.content).trim() };
      }

      working.push(ai);

      for (const call of toolCalls) {
        const tool = this.toolMap.get(call.name);
        if (!tool) {
          working.push(
            new ToolMessage({
              tool_call_id: call.id ?? '',
              content: `\u672a\u627e\u5230\u5de5\u5177\uff1a${call.name}`,
            }),
          );
          continue;
        }

        const result = await tool.invoke(call.args ?? {});
        working.push(
          new ToolMessage({
            tool_call_id: call.id ?? '',
            content: typeof result === 'string' ? result : JSON.stringify(result),
          }),
        );
      }
    }

    return {
      working,
      directAnswer:
        '\u5df2\u8fbe\u5230\u5f53\u524d\u63a8\u7406\u8f6e\u6b21\u4e0a\u9650\uff0c\u8bf7\u7f29\u5c0f\u95ee\u9898\u8303\u56f4\u540e\u91cd\u8bd5\u3002',
    };
  }

  async run(input) {
    if (!env.OPENAI_API_KEY) {
      return {
        text: '\u670d\u52a1\u5df2\u542f\u52a8\uff0c\u4f46\u672a\u914d\u7f6e OPENAI_API_KEY\uff0c\u8bf7\u5728 .env \u4e2d\u8bbe\u7f6e\u540e\u91cd\u8bd5\u3002',
      };
    }

    const { working, directAnswer } = await this.resolveToolContext(input.messages, input.model);

    if (directAnswer) {
      return { text: directAnswer };
    }

    const finalModel = createChatModel(input.model);
    const final = await finalModel.invoke([...working, new HumanMessage(FINAL_STREAM_PROMPT)]);
    return { text: contentToText(final.content).trim() };
  }

  async stream(input) {
    if (!env.OPENAI_API_KEY) {
      const text =
        '\u670d\u52a1\u5df2\u542f\u52a8\uff0c\u4f46\u672a\u914d\u7f6e OPENAI_API_KEY\uff0c\u8bf7\u5728 .env \u4e2d\u8bbe\u7f6e\u540e\u91cd\u8bd5\u3002';
      if (typeof input.onToken === 'function') {
        for (const part of splitForSSE(text, 20)) input.onToken(part);
      }
      return { text };
    }

    const { working, directAnswer } = await this.resolveToolContext(input.messages, input.model);
    if (directAnswer) {
      if (typeof input.onToken === 'function') {
        for (const part of splitForSSE(directAnswer, 20)) input.onToken(part);
      }
      return { text: directAnswer };
    }

    const finalModel = createChatModel(input.model);
    const stream = await finalModel.stream([...working, new HumanMessage(FINAL_STREAM_PROMPT)]);

    let output = '';
    for await (const chunk of stream) {
      const token = contentToText(chunk.content);
      if (!token) continue;
      output += token;
      if (typeof input.onToken === 'function') {
        input.onToken(token);
      }
    }

    return { text: output.trim() };
  }
}

export const smartConstructionAgent = new SmartConstructionAgentService();
