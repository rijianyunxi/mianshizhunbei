import Router from '@koa/router';
import { z } from 'zod';
import { smartConstructionAgent } from '../agent/smartConstructionAgent.js';
import { endSSE, prepareSSE, sendSSEData } from '../utils/sse.js';
const agentChatSchema = z.object({
    sessionId: z.string().uuid().optional(),
    input: z.string().min(1),
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
});
function withSiteContext(input, siteContext) {
    if (!siteContext)
        return input;
    return `${input}\n\n[工地上下文]\n${JSON.stringify(siteContext, null, 2)}`;
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
    const history = smartConstructionAgent.getSessionHistory(sessionId);
    const userInput = withSiteContext(payload.input, payload.siteContext);
    const requestMessages = [...history, { role: 'user', content: userInput }];
    const result = await smartConstructionAgent.run({ messages: requestMessages });
    smartConstructionAgent.appendSessionMessage(sessionId, { role: 'user', content: userInput });
    const nextHistory = smartConstructionAgent.appendSessionMessage(sessionId, {
        role: 'assistant',
        content: result.text,
    });
    if (!payload.stream) {
        ctx.body = {
            sessionId,
            reply: result.text,
            history: nextHistory,
        };
        return;
    }
    prepareSSE(ctx);
    sendSSEData(ctx, { sessionId, type: 'start' });
    for (const chunk of smartConstructionAgent.toSSEChunks(result.text)) {
        sendSSEData(ctx, { sessionId, type: 'delta', delta: chunk });
    }
    sendSSEData(ctx, { sessionId, type: 'done' });
    endSSE(ctx);
});
