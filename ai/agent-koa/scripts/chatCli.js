import process from 'node:process';

function printHelp() {
  console.log(`Usage:
  npm run chat -- [--stream] [--thread <thread_id>] [--url <base_url>] <message>

Examples:
  npm run chat -- "今天塔吊吊装前要检查什么"
  npm run chat -- --stream "评估夜间高处作业风险"
  npm run chat -- --stream --thread my-thread-1 "继续上次方案"
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    stream: false,
    threadId: undefined,
    baseUrl: process.env.AGENT_BASE_URL || 'http://localhost:8787',
    prompt: '',
  };

  const promptParts = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--stream') {
      options.stream = true;
      continue;
    }
    if (arg === '--thread') {
      options.threadId = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--url') {
      options.baseUrl = args[i + 1] || options.baseUrl;
      i += 1;
      continue;
    }
    promptParts.push(arg);
  }

  options.prompt = promptParts.join(' ').trim();
  return options;
}

function buildRequestBody(options) {
  const body = {
    input: options.prompt,
    stream: options.stream,
  };
  if (options.threadId) body.thread_id = options.threadId;
  return body;
}

async function runNonStream(baseUrl, body) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/agent/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  console.log(`thread_id: ${data.thread_id}`);
  console.log(data.reply || '');
  if (Array.isArray(data.selected_tools) && data.selected_tools.length > 0) {
    console.log('\nselected_tools:');
    for (const tool of data.selected_tools) {
      console.log(`- ${tool.server_id}/${tool.name}`);
    }
  }
}

function parseSSEChunk(buffer) {
  const events = [];
  while (true) {
    const idx = buffer.indexOf('\n\n');
    if (idx < 0) break;
    const rawEvent = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 2);

    const lines = rawEvent.split('\n');
    const dataLines = lines.filter((line) => line.startsWith('data:')).map((line) => line.replace(/^data:\s*/, ''));
    if (dataLines.length === 0) continue;
    events.push(dataLines.join('\n'));
  }
  return { buffer, events };
}

async function runStream(baseUrl, body) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/agent/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let threadId = body.thread_id || '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

    const parsed = parseSSEChunk(buffer);
    buffer = parsed.buffer;

    for (const eventText of parsed.events) {
      let payload;
      try {
        payload = JSON.parse(eventText);
      } catch {
        continue;
      }

      if (payload.type === 'start') {
        threadId = payload.thread_id || threadId;
        if (threadId) {
          process.stderr.write(`thread_id: ${threadId}\n`);
        }
        continue;
      }

      if (payload.type === 'delta') {
        process.stdout.write(payload.delta || '');
        continue;
      }

      if (payload.type === 'tool_start') {
        process.stderr.write(`\n[tool_start] ${payload.server_id}/${payload.tool_name}\n`);
        continue;
      }

      if (payload.type === 'tool_end') {
        process.stderr.write(`[tool_end] ${payload.server_id}/${payload.tool_name}\n`);
        continue;
      }

      if (payload.type === 'error') {
        process.stderr.write(`\n[error] ${payload.error}\n`);
      }
    }
  }

  process.stdout.write('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.prompt) {
    printHelp();
    process.exit(options.help ? 0 : 1);
  }

  const body = buildRequestBody(options);
  if (options.stream) {
    await runStream(options.baseUrl, body);
    return;
  }
  await runNonStream(options.baseUrl, body);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
