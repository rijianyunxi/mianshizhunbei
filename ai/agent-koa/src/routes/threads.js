import { Router } from 'express';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
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

export const threadsRouter = Router();

threadsRouter.get('/agent/threads', (req, res) => {
  const parsed = listThreadsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid query',
      details: parsed.error.flatten(),
    });
    return;
  }

  const items = conversationStore.listConversations(parsed.data.limit);
  res.json({ items });
});

threadsRouter.post('/agent/threads', (req, res) => {
  const parsed = createThreadSchema.safeParse(req.body || {});
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    });
    return;
  }

  const threadId = smartConstructionAgent.createThreadId();
  const item = conversationStore.createConversation(threadId, parsed.data.title);

  res.status(201).json({
    thread_id: threadId,
    item,
  });
});

threadsRouter.get('/agent/threads/:threadId/messages', (req, res) => {
  const parsed = listMessagesSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid query',
      details: parsed.error.flatten(),
    });
    return;
  }

  const threadId = String(req.params.threadId || '').trim();
  if (!threadId) {
    res.status(400).json({ error: 'threadId is required' });
    return;
  }

  const items = conversationStore.listMessages(threadId, parsed.data.limit);
  res.json({ thread_id: threadId, items });
});

threadsRouter.delete('/agent/threads/:threadId', (req, res) => {
  const threadId = String(req.params.threadId || '').trim();
  if (!threadId) {
    res.status(400).json({ error: 'threadId is required' });
    return;
  }

  conversationStore.deleteConversation(threadId);
  res.status(204).end();
});
