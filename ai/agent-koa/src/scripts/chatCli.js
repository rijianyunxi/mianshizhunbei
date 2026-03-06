import { parseArgs } from 'node:util';
import dotenv from 'dotenv';

dotenv.config();

const parsed = parseArgs({
  options: {
    stream: { type: 'boolean', short: 's', default: false },
    session: { type: 'string' },
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
      '  npm run chat -- "Your question"',
      '',
      'Examples:',
      '  npm run chat -- "Generate pre-shift checklist for tower crane lifting"',
      '  npm run chat -- --stream --session <sessionId> "Continue previous topic"',
      '  npm run chat -- --stream --project "Site-A" --city Shanghai --weather "gust level 7" --operation lifting "Assess risks"',
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
  sessionId: parsed.values.session,
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
  console.log(`sessionId: ${data.sessionId}`);
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
let sessionId = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) {
    break;
  }

  buffer += decoder.decode(value, { stream: true });
  while (true) {
    const boundary = /\r?\n\r?\n/.exec(buffer);
    if (!boundary) {
      break;
    }

    const rawEvent = buffer.slice(0, boundary.index);
    buffer = buffer.slice(boundary.index + boundary[0].length);
    const dataLine = rawEvent
      .split(/\r?\n/)
      .find((line) => line.startsWith('data:'))
      ?.slice(5)
      .trimStart();

    if (!dataLine) {
      continue;
    }

    try {
      const event = JSON.parse(dataLine);
      if (event.sessionId) {
        sessionId = event.sessionId;
      }
      if (event.type === 'delta' && event.delta) {
        process.stdout.write(event.delta);
      }
      if (event.type === 'done') {
        process.stdout.write('\n');
      }
    } catch {
      // Ignore malformed SSE events.
    }
  }
}

if (sessionId) {
  console.log(`sessionId: ${sessionId}`);
}
