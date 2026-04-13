import Router from '@koa/router';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { clearThreadCheckpoints } from '../persistence/checkpointer.js';
import { conversationStore } from '../persistence/conversations.js';

const listThreadsSchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional().default(100),
});

const listMessagesSchema = z.object({
  limit: z.coerce.number().int().positive().max(2000).optional().default(500),
});

const createThreadSchema = z.object({
  title: z.string().max(200).optional(),
});

export const threadsRouter = new Router();

threadsRouter.get('/agent/threads', async (ctx) => {
  const parsed = listThreadsSchema.safeParse(ctx.query);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid query',
      details: parsed.error.flatten(),
    };
    return;
  }

  const items = await conversationStore.listConversations(parsed.data.limit);
  ctx.body = { items };
});

threadsRouter.post('/agent/threads', async (ctx) => {
  const parsed = createThreadSchema.safeParse(ctx.request.body || {});
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    };
    return;
  }

  const threadId = smartConstructionAgent.createThreadId();
  const item = await conversationStore.createConversation(threadId, parsed.data.title);

  ctx.status = 201;
  ctx.body = {
    thread_id: threadId,
    item,
  };
});

threadsRouter.get('/agent/threads/:threadId/messages', async (ctx) => {
  const parsed = listMessagesSchema.safeParse(ctx.query);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid query',
      details: parsed.error.flatten(),
    };
    return;
  }

  const threadId = String(ctx.params.threadId || '').trim();
  if (!threadId) {
    ctx.status = 400;
    ctx.body = { error: 'threadId is required' };
    return;
  }

  const items = await conversationStore.listMessages(threadId, parsed.data.limit);
  ctx.body = { thread_id: threadId, items };
});

threadsRouter.delete('/agent/threads/:threadId', async (ctx) => {
  const threadId = String(ctx.params.threadId || '').trim();
  if (!threadId) {
    ctx.status = 400;
    ctx.body = { error: 'threadId is required' };
    return;
  }

  await clearThreadCheckpoints(threadId);
  await conversationStore.deleteConversation(threadId);
  ctx.status = 204;
});
