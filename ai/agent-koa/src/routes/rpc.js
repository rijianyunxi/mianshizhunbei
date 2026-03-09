import { Router } from 'express';
import { z } from 'zod';
import { mcpRegistry } from '../mcp/mcpRegistry.js';

const callSchema = z.object({
  server_id: z.string().min(1),
  tool_name: z.string().min(1),
  arguments: z.record(z.string(), z.any()).optional().default({}),
});

export const rpcRouter = Router();

rpcRouter.post('/rpc/mcp/call', async (req, res) => {
  const parsed = callSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const payload = parsed.data;
    const result = await mcpRegistry.callTool(payload.server_id, payload.tool_name, payload.arguments);
    res.json({
      ok: !result.isError,
      server_id: payload.server_id,
      tool_name: payload.tool_name,
      text: result.text,
      raw: result.raw,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ ok: false, error: message });
  }
});
