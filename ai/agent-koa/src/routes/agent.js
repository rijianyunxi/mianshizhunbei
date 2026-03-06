import Router from '@koa/router';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { endSSE, prepareSSE, sendSSEData } from '../utils/sse.js';

const agentChatSchema = z.object({
  sessionId: z.string().uuid().optional(),
  input: z.string().trim().min(1).max(4000),
  stream: z.boolean().optional().default(false),
  model: z.string().trim().min(1).max(120).optional(),
  siteContext: z
    .object({
      projectName: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      weather: z.string().max(200).optional(),
      operationType: z.string().max(200).optional(),
      shift: z.enum(['day', 'night']).optional(),
    })
    .optional(),
});

function withSiteContext(input, siteContext) {
  if (!siteContext) return input;
  return `${input}\n\n[工地上下文]\n${JSON.stringify(siteContext, null, 2)}`;
}

function toErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unknown server error';
}

export const agentRouter = new Router();

agentRouter.post('/agent/chat', async (ctx) => {
  const parsed = agentChatSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    };
    return;
  }

  const payload = parsed.data;
  const sessionId = payload.sessionId ?? smartConstructionAgent.createSessionId();
  const userInput = withSiteContext(payload.input, payload.siteContext);
  const messages = [{ role: 'user', content: userInput }];

  if (!payload.stream) {
    try {
      const result = await smartConstructionAgent.run({
        sessionId,
        persistSession: true,
        model: payload.model,
        messages,
      });

      ctx.body = {
        sessionId,
        reply: result.text,
        history: smartConstructionAgent.getSessionHistory(sessionId),
      };
      return;
    } catch (error) {
      console.error('[agent-route] non-stream failed', {
        sessionId,
        model: payload.model,
        message: toErrorMessage(error),
      });
      ctx.status = 500;
      ctx.body = {
        error: 'Agent execution failed',
        message: toErrorMessage(error),
      };
      return;
    }
  }

  prepareSSE(ctx);
  sendSSEData(ctx, { sessionId, type: 'start' });

  try {
    await smartConstructionAgent.stream({
      sessionId,
      persistSession: true,
      model: payload.model,
      messages,
      onToken: (token) => {
        sendSSEData(ctx, { sessionId, type: 'delta', delta: token });
      },
    });

    sendSSEData(ctx, { sessionId, type: 'done' });
  } catch (error) {
    console.error('[agent-route] stream failed', {
      sessionId,
      model: payload.model,
      message: toErrorMessage(error),
    });
    sendSSEData(ctx, {
      sessionId,
      type: 'error',
      message: toErrorMessage(error),
    });
    sendSSEData(ctx, { sessionId, type: 'done' });
  } finally {
    endSSE(ctx);
  }
});
