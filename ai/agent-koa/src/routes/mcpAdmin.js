import { Router } from 'express';
import { z } from 'zod';
import { mcpRegistry } from '../mcp/mcpRegistry.js';
import { toolRouter } from '../tooling/toolRouter.js';

const enableSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1).optional(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  description: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  enabled: z.boolean().optional(),
});

const disableSchema = z.object({
  id: z.string().min(1),
});

export const mcpAdminRouter = Router();

mcpAdminRouter.get('/admin/mcp/servers', async (_req, res) => {
  res.json({ servers: mcpRegistry.list(), router: toolRouter.getStatus() });
});

mcpAdminRouter.post('/admin/mcp/servers/enable', async (req, res) => {
  const parsed = enableSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const override = payload.command
    ? {
        id: payload.id,
        command: payload.command,
        args: payload.args,
        cwd: payload.cwd,
        description: payload.description,
        env: payload.env,
        enabled: payload.enabled,
      }
    : undefined;

  const connection = await mcpRegistry.enable(payload.id, override);
  const routerState = await toolRouter.rebuildIndex();

  res.json({
    ok: true,
    server: {
      id: connection.id,
      tool_count: connection.tools.length,
      pid: connection.transport?.pid ?? null,
      connected_at: connection.connectedAt,
    },
    router: routerState,
  });
});

mcpAdminRouter.post('/admin/mcp/servers/disable', async (req, res) => {
  const parsed = disableSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const ok = await mcpRegistry.disable(parsed.data.id);
  const routerState = await toolRouter.rebuildIndex();

  res.json({ ok, router: routerState });
});

mcpAdminRouter.post('/admin/mcp/reindex', async (_req, res) => {
  const status = await toolRouter.rebuildIndex();
  res.json({ ok: true, router: status });
});

mcpAdminRouter.get('/admin/mcp/tools', async (_req, res) => {
  res.json({
    tools: mcpRegistry.getToolDescriptors().map((tool) => ({
      key: tool.key,
      runtime_name: tool.runtimeName,
      server_id: tool.serverId,
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    })),
    router: toolRouter.getStatus(),
  });
});
