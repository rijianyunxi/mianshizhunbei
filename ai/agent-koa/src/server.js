import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { checkpointSaver, sqlitePath } from './persistence/checkpointer.js';
import { agentRouter } from './routes/agent.js';
import { mcpAdminRouter } from './routes/mcpAdmin.js';
import { openAICompatibleRouter } from './routes/openaiCompatible.js';
import { rpcRouter } from './routes/rpc.js';
import { threadsRouter } from './routes/threads.js';
import { toolRouter } from './tooling/toolRouter.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use((req, res, next) => {
  if (!env.AGENT_API_TOKEN) {
    next();
    return;
  }

  if (req.path === '/health') {
    next();
    return;
  }

  const authorization = req.headers.authorization || '';
  if (authorization === `Bearer ${env.AGENT_API_TOKEN}`) {
    next();
    return;
  }

  res.status(401).json({
    error: {
      message: 'Unauthorized',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    build: '2026-03-09-nav-direct-v1',
    model: env.OPENAI_MODEL,
    sqlite_path: sqlitePath,
    active_mcp_servers: mcpRegistry.list().filter((item) => item.active).length,
    tool_router: toolRouter.getStatus(),
    time: new Date().toISOString(),
  });
});

app.use(agentRouter);
app.use(threadsRouter);
app.use(openAICompatibleRouter);
app.use(mcpAdminRouter);
app.use(rpcRouter);

app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('[server-error]', err);
  res.status(500).json({ error: { message } });
});

let server = null;

async function bootstrap() {
  // Touch checkpointer once so sqlite schema initializes early.
  await checkpointSaver.getTuple({ configurable: { thread_id: '__boot__', checkpoint_ns: '__boot__' } }).catch(() => undefined);

  const bootErrors = await mcpRegistry.bootstrapEnabled();
  const routerState = await toolRouter.rebuildIndex();

  if (bootErrors.length > 0) {
    console.error('[mcp-bootstrap] Some plugins failed to connect:', bootErrors);
  }

  console.log('[tool-router] status:', routerState);
}

async function shutdown(signal) {
  console.log(`[agent-server] received ${signal}, shutting down...`);
  try {
    await mcpRegistry.shutdown();
  } catch (error) {
    console.error('[agent-server] failed to close MCP connections:', error);
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

await bootstrap();

server = app.listen(env.PORT, () => {
  console.log(`[agent-server] listening on http://localhost:${env.PORT}`);
});
