import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { env } from './config/env.js';
import { agentRouter } from './routes/agent.js';
import { openAICompatibleRouter } from './routes/openaiCompatible.js';

const app = new Koa();
const rootRouter = new Router();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    ctx.status = 500;
    ctx.body = {
      error: {
        message,
      },
    };
  }
});

app.use(cors());
app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '2mb' }));

app.use(async (ctx, next) => {
  if (!env.AGENT_API_TOKEN) {
    await next();
    return;
  }

  const auth = ctx.get('authorization');
  if (auth === `Bearer ${env.AGENT_API_TOKEN}`) {
    await next();
    return;
  }

  ctx.status = 401;
  ctx.body = {
    error: {
      message: 'Unauthorized',
    },
  };
});

rootRouter.get('/health', (ctx) => {
  ctx.body = {
    ok: true,
    model: env.OPENAI_MODEL,
    time: new Date().toISOString(),
  };
});

app.use(rootRouter.routes()).use(rootRouter.allowedMethods());
app.use(agentRouter.routes()).use(agentRouter.allowedMethods());
app.use(openAICompatibleRouter.routes()).use(openAICompatibleRouter.allowedMethods());

app.listen(env.PORT, () => {
  console.log(`[agent-koa] listening on http://localhost:${env.PORT}`);
});
