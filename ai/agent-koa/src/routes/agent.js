import { Router } from 'express';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { conversationStore } from '../persistence/conversations.js';
import { endSSE, prepareSSE, sendSSEData } from '../utils/sse.js';

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1),
});

const agentChatSchema = z
  .object({
    thread_id: z.string().optional(),
    input: z.string().min(1).optional(),
    messages: z.array(messageSchema).optional(),
    stream: z.boolean().optional().default(false),
    siteContext: z
      .object({
        projectName: z.string().optional(),
        city: z.string().optional(),
        weather: z.string().optional(),
        operationType: z.string().optional(),
        shift: z.enum(['day', 'night']).optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if ((!value.input || !value.input.trim()) && (!value.messages || value.messages.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either input or messages is required',
      });
    }
  });

function withSiteContext(input, siteContext) {
  if (!siteContext) return input;
  return `${input}\n\n[工地上下文]\n${JSON.stringify(siteContext, null, 2)}`;
}

function resolveMessages(payload) {
  if (payload.messages && payload.messages.length > 0) {
    return payload.messages;
  }

  return [
    {
      role: 'user',
      content: withSiteContext(payload.input || '', payload.siteContext),
    },
  ];
}

function extractLatestUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }

  return null;
}

export const agentRouter = Router();

agentRouter.post('/agent/chat', async (req, res) => {
  const parsed = agentChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    });
    return;
  }

  const payload = parsed.data;
  const threadId = payload.thread_id || smartConstructionAgent.createThreadId();
  const messages = resolveMessages(payload);
  const latestUserMessage = extractLatestUserMessage(messages);

  if (!payload.stream) {
    if (latestUserMessage) {
      conversationStore.appendMessage(threadId, 'user', latestUserMessage.content);
    }

    const result = await smartConstructionAgent.run({
      threadId,
      messages,
      persistThread: true,
    });

    conversationStore.appendMessage(threadId, 'assistant', result.text);

    res.json({
      thread_id: threadId,
      reply: result.text,
      selected_tools: result.selectedTools.map((tool) => ({
        key: tool.key,
        server_id: tool.serverId,
        name: tool.name,
      })),
    });
    return;
  }

  prepareSSE(res);
  sendSSEData(res, { type: 'start', thread_id: threadId });

  try {
    if (latestUserMessage) {
      conversationStore.appendMessage(threadId, 'user', latestUserMessage.content);
    }

    const result = await smartConstructionAgent.stream({
      threadId,
      messages,
      persistThread: true,
      onToken: (token) => {
        sendSSEData(res, { type: 'delta', thread_id: threadId, delta: token });
      },
      onToolStart: ({ name, runtimeName, serverId, toolName, input }) => {
        sendSSEData(res, {
          type: 'tool_start',
          thread_id: threadId,
          tool: name,
          runtime_name: runtimeName,
          server_id: serverId,
          tool_name: toolName,
          tool_input: input,
        });
      },
      onToolEnd: ({ name, runtimeName, serverId, toolName }) => {
        sendSSEData(res, {
          type: 'tool_end',
          thread_id: threadId,
          tool: name,
          runtime_name: runtimeName,
          server_id: serverId,
          tool_name: toolName,
        });
      },
    });

    conversationStore.appendMessage(threadId, 'assistant', result.text);

    sendSSEData(res, {
      type: 'done',
      thread_id: threadId,
      selected_tools: result.selectedTools.map((tool) => ({
        key: tool.key,
        server_id: tool.serverId,
        name: tool.name,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendSSEData(res, { type: 'error', thread_id: threadId, error: message });
  }

  endSSE(res);
});
