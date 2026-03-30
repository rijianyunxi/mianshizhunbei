function getResponse(target) {
  if (target?.res) return target.res;
  return target;
}

export function prepareSSE(target) {
  const res = getResponse(target);
  if (target && typeof target === 'object' && 'respond' in target) {
    target.respond = false;
    target.status = 200;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

export function sendSSEData(target, data, event) {
  const res = getResponse(target);
  if (event) {
    res.write(`event: ${event}\n`);
  }
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function endSSE(target) {
  const res = getResponse(target);
  res.end();
}
