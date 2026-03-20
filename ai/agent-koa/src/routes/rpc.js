import Router from '@koa/router';
import { z } from 'zod';
import { mcpRegistry } from '../mcp/mcpRegistry.js';

const callSchema = z.object({
  server_id: z.string().min(1),
  tool_name: z.string().min(1),
  arguments: z.record(z.string(), z.any()).optional().default({}),
});

export const rpcRouter = new Router();

rpcRouter.post('/rpc/mcp/call', async (ctx) => {
  const parsed = callSchema.safeParse(ctx.request.body);
  if (!parsed.success) {
    ctx.status = 400;
    ctx.body = { error: parsed.error.flatten() };
    return;
  }

  try {
    const payload = parsed.data;
    const result = await mcpRegistry.callTool(payload.server_id, payload.tool_name, payload.arguments);
    ctx.body = {
      ok: !result.isError,
      server_id: payload.server_id,
      tool_name: payload.tool_name,
      text: result.text,
      raw: result.raw,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.status = 500;
    ctx.body = { ok: false, error: message };
  }
});
