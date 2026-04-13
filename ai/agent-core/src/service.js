import { randomUUID } from 'node:crypto';
import { shouldAttemptRuntimeRecovery } from './errors.js';
import { extractAssistantText, extractTextFromMessageLike, trimConversationMessages } from './messages.js';

function buildAgentState(messages) {
  return { messages };
}

function buildSelectedToolMap(selectedTools) {
  const map = new Map();
  for (const tool of Array.isArray(selectedTools) ? selectedTools : []) {
    if (tool?.runtimeName) {
      map.set(tool.runtimeName, tool);
    }
    if (tool?.name) {
      map.set(tool.name, tool);
    }
  }
  return map;
}

function eventInputFromChunk(chunk) {
  if (!chunk || typeof chunk !== 'object') return '';
  if (typeof chunk === 'string') return chunk;
  return extractTextFromMessageLike(chunk);
}

export class CoreAgentService {
  constructor(options) {
    this.systemPrompt = options.systemPrompt;
    this.contextRounds = options.contextRounds;
    this.maxIterations = options.maxIterations;
    this.maxToolCalls = options.maxToolCalls;
    this.buildRuntime = options.buildRuntime;
    this.recoverRuntimeState = options.recoverRuntimeState;
  }

  createThreadId() {
    return randomUUID();
  }

  async run(input) {
    return this.#execute(input, 'run');
  }

  async stream(input) {
    return this.#execute(input, 'stream');
  }

  async #execute(input, mode) {
    let recovered = false;

    for (;;) {
      try {
        const runtime = await this.#createRuntime(input);
        if (runtime?.errorText) {
          return {
            text: runtime.errorText,
            selectedTools: runtime.selectedTools || [],
          };
        }

        if (mode === 'stream') {
          return await this.#streamRuntime(runtime, input);
        }
        return await this.#runRuntime(runtime);
      } catch (error) {
        if (
          recovered ||
          !this.recoverRuntimeState ||
          !shouldAttemptRuntimeRecovery(error)
        ) {
          throw error;
        }

        recovered = true;
        await this.recoverRuntimeState({ input, error, mode });
      }
    }
  }

  async #createRuntime(input) {
    const messages = trimConversationMessages(input.messages, this.contextRounds);
    return this.buildRuntime({
      input,
      messages,
      systemPrompt: this.systemPrompt,
      maxIterations: this.maxIterations,
      maxToolCalls: this.maxToolCalls,
    });
  }

  async #runRuntime(runtime) {
    const result = await runtime.agent.invoke(
      buildAgentState(runtime.messages),
      runtime.config || {},
    );

    return {
      text: extractAssistantText(result),
      selectedTools: runtime.selectedTools || [],
      raw: result,
    };
  }

  async #streamRuntime(runtime, input) {
    const selectedToolMap = buildSelectedToolMap(runtime.selectedTools);
    const config = { ...(runtime.config || {}), version: 'v2' };
    const stream = await runtime.agent.streamEvents(buildAgentState(runtime.messages), config);

    let text = '';
    let finalOutput = null;
    let toolCalls = 0;

    for await (const event of stream) {
      if (!event || typeof event !== 'object') continue;

      if (event.event === 'on_chat_model_stream') {
        const delta = eventInputFromChunk(event.data?.chunk);
        if (delta) {
          text += delta;
          input.onToken?.(delta);
        }
        continue;
      }

      if (event.event === 'on_tool_start') {
        toolCalls += 1;
        if (toolCalls > this.maxToolCalls) {
          throw new Error(`Tool call limit exceeded (${this.maxToolCalls})`);
        }

        const descriptor = selectedToolMap.get(event.name);
        input.onToolStart?.({
          name: event.name,
          runtimeName: descriptor?.runtimeName || event.name,
          serverId: descriptor?.serverId,
          toolName: descriptor?.name,
          input: event.data?.input,
        });
        continue;
      }

      if (event.event === 'on_tool_end') {
        const descriptor = selectedToolMap.get(event.name);
        input.onToolEnd?.({
          name: event.name,
          runtimeName: descriptor?.runtimeName || event.name,
          serverId: descriptor?.serverId,
          toolName: descriptor?.name,
          output: event.data?.output,
        });
        continue;
      }

      if (event.data?.output) {
        finalOutput = event.data.output;
      }
    }

    if (!text && finalOutput) {
      text = extractAssistantText(finalOutput);
    }

    return {
      text,
      selectedTools: runtime.selectedTools || [],
      raw: finalOutput,
    };
  }
}
