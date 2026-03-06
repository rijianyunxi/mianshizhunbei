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

function canWrite(ctx) {
  return Boolean(ctx?.res && !ctx.res.writableEnded && !ctx.res.destroyed);
}

export function sendSSEData(ctx, data) {
  if (!canWrite(ctx)) return false;
  try {
    ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

export function endSSE(ctx) {
  if (!canWrite(ctx)) return;
  ctx.res.end();
}
