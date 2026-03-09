export function prepareSSE(res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

export function sendSSEData(res, data, event) {
  if (event) {
    res.write(`event: ${event}\n`);
  }
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sendSSERaw(res, rawLine) {
  res.write(`data: ${rawLine}\n\n`);
}

export function endSSE(res) {
  res.end();
}
