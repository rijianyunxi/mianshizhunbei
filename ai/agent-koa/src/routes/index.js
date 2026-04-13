import Router from '@koa/router';
import { agentRouter } from './agent.js';
import { mcpAdminRouter } from './mcpAdmin.js';
import { openAICompatibleRouter } from './openaiCompatible.js';
import { rpcRouter } from './rpc.js';
import { threadsRouter } from './threads.js';

const BUILD_ID = '2026-03-09-nav-direct-v1';
const subRouters = [agentRouter, threadsRouter, openAICompatibleRouter, mcpAdminRouter, rpcRouter];

function buildHealthPayload({ env, mcpRegistry, toolRouter, storageInfo }) {
  return {
    ok: true,
    build: BUILD_ID,
    model: env.OPENAI_MODEL,
    storage: storageInfo,
    pg: storageInfo.provider === 'postgres' ? storageInfo : null,
    active_mcp_servers: mcpRegistry.list().filter((item) => item.active).length,
    tool_router: toolRouter.getStatus(),
    time: new Date().toISOString(),
  };
}

function mountSubRouters(rootRouter) {
  for (const router of subRouters) {
    rootRouter.use(router.routes(), router.allowedMethods());
  }
}

export function createApiRouter(deps) {
  const router = new Router();

  router.get('/health', (ctx) => {
    ctx.body = buildHealthPayload(deps);
  });

  mountSubRouters(router);
  return router;
}
