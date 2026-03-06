import Router from '@koa/router';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { endSSE, prepareSSE } from '../utils/sse.js';
const requestSchema = z.object({
    model: z.string().optional(),
    stream: z.boolean().optional().default(false),
    messages: z
        .array(z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
    }))
        .min(1),
});
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
    const result = await smartConstructionAgent.run({
        model: payload.model,
        messages: payload.messages,
    });
    if (!payload.stream) {
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
    }
    prepareSSE(ctx);
    ctx.res.write(`data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
    })}\n\n`);
    for (const chunk of smartConstructionAgent.toSSEChunks(result.text)) {
        ctx.res.write(`data: ${JSON.stringify({
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
        })}\n\n`);
    }
    ctx.res.write(`data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    })}\n\n`);
    ctx.res.write('data: [DONE]\n\n');
    endSSE(ctx);
});
