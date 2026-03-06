export function prepareSSE(ctx) {
  ctx.req.setTimeout(0);
  ctx.status = 200;
  ctx.respond = false;
  ctx.res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  ctx.res.setHeader('Cache-Control', 'no-cache, no-transform');
  ctx.res.setHeader('Connection', 'keep-alive');
  if (typeof ctx.res.flushHeaders === 'function') {
    ctx.res.flushHeaders();
  }
}

export function sendSSEData(ctx, data) {
  ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function endSSE(ctx) {
  ctx.res.end();
}
