import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { createSmartSiteTools } from '../tools/smartSiteTools.js';
const AGENT_SYSTEM_PROMPT = `
你是“智慧工地AI助手”。
你的目标:
1. 优先保证施工安全与合规。
2. 在回答中给出可执行步骤，而不是泛泛建议。
3. 涉及作业风险、作业票、班前会、高风险工种时，必须优先调用工具获得结构化信息再作答。
4. 回答请使用简体中文，输出清晰、简洁、可落地。
`.trim();
function contentToText(content) {
    if (typeof content === 'string')
        return content;
    if (Array.isArray(content)) {
        return content
            .map((item) => {
            if (typeof item === 'string')
                return item;
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
        if (message.role === 'assistant')
            return new AIMessage(message.content);
        if (message.role === 'system')
            return new SystemMessage(message.content);
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
    if (current)
        chunks.push(current);
    return chunks;
}
class ConversationMemoryStore {
    maxHistory;
    store = new Map();
    constructor(maxHistory) {
        this.maxHistory = maxHistory;
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
export class SmartConstructionAgentService {
    model;
    tools = createSmartSiteTools();
    toolMap = new Map(this.tools.map((tool) => [tool.name, tool]));
    memory = new ConversationMemoryStore(env.AGENT_MAX_HISTORY);
    constructor() {
        this.model = new ChatOpenAI({
            apiKey: env.OPENAI_API_KEY,
            model: env.OPENAI_MODEL,
            configuration: env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : undefined,
            temperature: 0.2,
        });
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
    async run(input) {
        const chatModel = input.model
            ? new ChatOpenAI({
                apiKey: env.OPENAI_API_KEY,
                model: input.model,
                configuration: env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : undefined,
                temperature: 0.2,
            })
            : this.model;
        const baseMessages = [
            new SystemMessage(AGENT_SYSTEM_PROMPT),
            ...mapChatMessagesToLangChain(input.messages),
        ];
        const callable = chatModel.bindTools(this.tools);
        const working = [...baseMessages];
        for (let step = 0; step < 6; step += 1) {
            const ai = await callable.invoke(working);
            working.push(ai);
            const toolCalls = ai.tool_calls ?? [];
            if (toolCalls.length === 0) {
                return { text: contentToText(ai.content).trim() };
            }
            for (const call of toolCalls) {
                const tool = this.toolMap.get(call.name);
                if (!tool) {
                    working.push(new ToolMessage({
                        tool_call_id: call.id ?? '',
                        content: `Tool "${call.name}" not found.`,
                    }));
                    continue;
                }
                const result = await tool.invoke(call.args ?? {});
                working.push(new ToolMessage({
                    tool_call_id: call.id ?? '',
                    content: typeof result === 'string' ? result : JSON.stringify(result),
                }));
            }
        }
        return { text: '我已达到本轮推理上限，请缩小问题范围后重试。' };
    }
    toSSEChunks(text) {
        return splitForSSE(text);
    }
}
export const smartConstructionAgent = new SmartConstructionAgentService();
