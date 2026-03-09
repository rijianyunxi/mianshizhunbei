import { Router } from 'express';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { env } from '../config/env.js';
import { endSSE, prepareSSE } from '../utils/sse.js';

const requestSchema = z.object({
  stream: z.boolean().optional().default(false),
  thread_id: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      }),
    )
    .min(1),
});

function selectMessagesForThread(payload) {
  if (!payload.thread_id) return payload.messages;

  for (let i = payload.messages.length - 1; i >= 0; i -= 1) {
    if (payload.messages[i].role === 'user') {
      return [payload.messages[i]];
    }
  }

  return payload.messages.slice(-1);
}

export const openAICompatibleRouter = Router();

openAICompatibleRouter.post('/v1/chat/completions', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        message: 'Invalid request body',
        type: 'invalid_request_error',
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const payload = parsed.data;
  const created = Math.floor(Date.now() / 1000);
  const id = `chatcmpl_${Date.now().toString(36)}`;
  const model = env.OPENAI_MODEL;

  const threadId = payload.thread_id || undefined;
  const messages = selectMessagesForThread(payload);
  const persistThread = Boolean(threadId);

  if (!payload.stream) {
    const result = await smartConstructionAgent.run({
      threadId,
      messages,
      persistThread,
    });

    res.json({
      id,
      object: 'chat.completion',
      created,
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: result.text },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: null,
        completion_tokens: null,
        total_tokens: null,
      },
    });
    return;
  }

  prepareSSE(res);
  res.write(
    `data: ${JSON.stringify({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
    })}\n\n`,
  );

  try {
    await smartConstructionAgent.stream({
      threadId,
      messages,
      persistThread,
      onToken: (token) => {
        res.write(
          `data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta: { content: token }, finish_reason: null }],
          })}\n\n`,
        );
      },
    });

    res.write(
      `data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      })}\n\n`,
    );
    res.write('data: [DONE]\n\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.write(
      `data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        error: { message },
      })}\n\n`,
    );
    res.write('data: [DONE]\n\n');
  }

  endSSE(res);
});
