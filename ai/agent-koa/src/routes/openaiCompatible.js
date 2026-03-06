import Router from '@koa/router';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { endSSE, prepareSSE } from '../utils/sse.js';

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  stream: z.boolean().optional().default(false),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().max(12_000),
      }),
    )
    .min(1)
    .max(48),
});

function toErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unknown server error';
}

function canWrite(ctx) {
  return Boolean(ctx?.res && !ctx.res.writableEnded && !ctx.res.destroyed);
}

function writeOpenAIChunk(ctx, data) {
  if (!canWrite(ctx)) return false;
  try {
    ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

function writeOpenAIDone(ctx) {
  if (!canWrite(ctx)) return;
  ctx.res.write('data: [DONE]\n\n');
}

export const openAICompatibleRouter = new Router();

openAICompatibleRouter.post('/v1/chat/completions', async (ctx) => {
  const parsed = requestSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = {
      error: {
        message: 'Invalid request body',
        type: 'invalid_request_error',
        details: parsed.error.flatten(),
      },
    };
    return;
  }

  const payload = parsed.data;
  const created = Math.floor(Date.now() / 1000);
  const id = `chatcmpl_${Date.now().toString(36)}`;
  const model = payload.model ?? 'smart-construction-agent';
  const persistSession = Boolean(payload.sessionId);

  if (!payload.stream) {
    try {
      const result = await smartConstructionAgent.run({
        sessionId: payload.sessionId,
        persistSession,
        model: payload.model,
        messages: payload.messages,
      });

      ctx.body = {
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
      };
      return;
    } catch (error) {
      console.error('[openai-compatible] non-stream failed', {
        sessionId: payload.sessionId,
        model: payload.model,
        message: toErrorMessage(error),
      });
      ctx.status = 500;
      ctx.body = {
        error: {
          message: toErrorMessage(error),
          type: 'server_error',
        },
      };
      return;
    }
  }

  prepareSSE(ctx);
  writeOpenAIChunk(ctx, {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
  });

  try {
    await smartConstructionAgent.stream({
      sessionId: payload.sessionId,
      persistSession,
      model: payload.model,
      messages: payload.messages,
      onToken: (token) => {
        writeOpenAIChunk(ctx, {
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: { content: token }, finish_reason: null }],
        });
      },
    });

    writeOpenAIChunk(ctx, {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    });
  } catch (error) {
    console.error('[openai-compatible] stream failed', {
      sessionId: payload.sessionId,
      model: payload.model,
      message: toErrorMessage(error),
    });

    writeOpenAIChunk(ctx, {
      error: {
        message: toErrorMessage(error),
        type: 'server_error',
      },
    });

    writeOpenAIChunk(ctx, {
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    });
  } finally {
    writeOpenAIDone(ctx);
    endSSE(ctx);
  }
});
