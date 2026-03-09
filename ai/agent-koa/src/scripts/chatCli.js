import { parseArgs } from 'node:util';
import dotenv from 'dotenv';

dotenv.config();

const parsed = parseArgs({
  options: {
    stream: { type: 'boolean', short: 's', default: false },
    thread: { type: 'string' },
    url: { type: 'string' },
    token: { type: 'string' },
    project: { type: 'string' },
    city: { type: 'string' },
    weather: { type: 'string' },
    operation: { type: 'string' },
    shift: { type: 'string' },
  },
  allowPositionals: true,
});

const input = parsed.positionals.join(' ').trim();
if (!input) {
  console.log(
    [
      'Usage:',
      '  npm run chat -- "今天塔吊吊装前要检查什么"',
      '',
      'Examples:',
      '  npm run chat -- --stream "夜间高处作业风险评估"',
      '  npm run chat -- --stream --thread <thread_id> "继续上次方案"',
      '  npm run chat -- --stream --project A区 --city 上海 --weather "6级风" --operation 吊装 "给我今日管控措施"',
    ].join('\n'),
  );
  process.exit(1);
}

const baseUrl = (parsed.values.url ?? process.env.AGENT_BASE_URL ?? `http://localhost:${process.env.PORT ?? '8787'}`).replace(
  /\/+$/,
  '',
);
const token = parsed.values.token ?? process.env.AGENT_API_TOKEN ?? '';
const stream = Boolean(parsed.values.stream);
const shift = parsed.values.shift === 'night' ? 'night' : parsed.values.shift === 'day' ? 'day' : undefined;

const body = {
  thread_id: parsed.values.thread,
  input,
  stream,
  siteContext:
    parsed.values.project || parsed.values.city || parsed.values.weather || parsed.values.operation || shift
      ? {
          projectName: parsed.values.project,
          city: parsed.values.city,
          weather: parsed.values.weather,
          operationType: parsed.values.operation,
          shift,
        }
      : undefined,
};

const headers = {
  'Content-Type': 'application/json',
};
if (token) {
  headers.Authorization = `Bearer ${token}`;
}

const response = await fetch(`${baseUrl}/agent/chat`, {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
});

if (!response.ok) {
  const text = await response.text();
  console.error(`Request failed (${response.status}): ${text}`);
  process.exit(1);
}

if (!stream) {
  const data = await response.json();
  console.log(`thread_id: ${data.thread_id}`);
  console.log(data.reply);
  process.exit(0);
}

if (!response.body) {
  console.error('Response has no stream body.');
  process.exit(1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let threadId = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  while (true) {
    const boundary = /\r?\n\r?\n/.exec(buffer);
    if (!boundary) break;

    const rawEvent = buffer.slice(0, boundary.index);
    buffer = buffer.slice(boundary.index + boundary[0].length);

    const dataLine = rawEvent
      .split(/\r?\n/)
      .find((line) => line.startsWith('data:'))
      ?.slice(5)
      .trimStart();

    if (!dataLine) continue;

    try {
      const event = JSON.parse(dataLine);
      if (event.thread_id) threadId = event.thread_id;

      if (event.type === 'delta' && event.delta) {
        process.stdout.write(event.delta);
      }

      if (event.type === 'tool_start' && event.tool) {
        process.stdout.write(`\n[tool:start] ${event.tool}\n`);
      }

      if (event.type === 'tool_end' && event.tool) {
        process.stdout.write(`\n[tool:end] ${event.tool}\n`);
      }

      if (event.type === 'done') {
        process.stdout.write('\n');
      }

      if (event.type === 'error' && event.error) {
        process.stdout.write(`\n[error] ${event.error}\n`);
      }
    } catch {
      // ignore malformed event
    }
  }
}

if (threadId) {
  console.log(`thread_id: ${threadId}`);
}
