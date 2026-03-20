import cors from '@koa/cors';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import morgan from 'koa-morgan';
import { env } from './config/env.js';
import { mcpRegistry } from './mcp/mcpRegistry.js';
import { checkpointSaver, sqlitePath } from './persistence/checkpointer.js';
import { createApiRouter } from './routes/index.js';
import { toolRouter } from './tooling/toolRouter.js';

// import './test/embedding.js';

const LOG_FORMAT = env.NODE_ENV === 'production' ? 'combined' : 'dev';
const PUBLIC_PATHS = new Set(['/health']);

function createErrorMiddleware() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[server-error]', error);
      ctx.status = 500;
      ctx.body = { error: { message } };
    }
  };
}

function createAuthMiddleware({ token, publicPaths }) {
  return async (ctx, next) => {
    if (!token || publicPaths.has(ctx.path)) {
      await next();
      return;
    }

    const authorization = ctx.get('authorization');
    if (authorization === `Bearer ${token}`) {
      await next();
      return;
    }

    ctx.status = 401;
    ctx.body = {
      error: {
        message: 'Unauthorized',
      },
    };
  };
}

function registerMiddlewares(app) {
  app.use(cors());
  app.use(bodyParser({ jsonLimit: '2mb' }));
  app.use(morgan(LOG_FORMAT));
  app.use(createErrorMiddleware());
  app.use(
    createAuthMiddleware({
      token: env.AGENT_API_TOKEN,
      publicPaths: PUBLIC_PATHS,
    }),
  );
}

function registerRoutes(app) {
  const apiRouter = createApiRouter({
    env,
    mcpRegistry,
    toolRouter,
    sqlitePath,
  });

  app.use(apiRouter.routes());
  app.use(apiRouter.allowedMethods());
}

function createApp() {
  const app = new Koa();
  registerMiddlewares(app);
  registerRoutes(app);
  return app;
}

const app = createApp();
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
