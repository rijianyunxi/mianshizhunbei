import { ZH_TEXT } from '../app/copy'
import { BACKEND_API_TOKEN, BACKEND_BASE_URL } from '../app/config'
import type { SelectedToolItem, ToolStreamInfo } from '../app/types'

type RequestAssistantReplyStreamInput = {
  input: string
  threadId: string | null
  onThreadId?: (threadId: string) => void
  onDelta: (delta: string) => void
  onToolStart?: (tool: ToolStreamInfo) => void
  onToolEnd?: (tool: ToolStreamInfo) => void
  onSelectedTools?: (tools: SelectedToolItem[]) => void
}

type AgentStreamSelectedTool = {
  key?: unknown
  server_id?: unknown
  name?: unknown
}

type AgentStreamEvent = {
  type?: string
  thread_id?: string
  delta?: string
  tool?: string
  runtime_name?: string
  server_id?: string
  tool_name?: string
  tool_input?: unknown
  selected_tools?: AgentStreamSelectedTool[]
  error?: string
}

type StreamEventHandlers = RequestAssistantReplyStreamInput

function parseSSEEventData(rawEvent: string): string | null {
  const lines = rawEvent.split(/\r?\n/)
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  return dataLines.join('\n')
}

function buildHeaders(apiToken: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`
  }

  return headers
}

function normalizeSelectedTools(input: unknown): SelectedToolItem[] {
  if (!Array.isArray(input)) {
    return []
  }

  const tools: SelectedToolItem[] = []
  for (const row of input) {
    if (!row || typeof row !== 'object') {
      continue
    }

    const item = row as AgentStreamSelectedTool
    const key = typeof item.key === 'string' ? item.key.trim() : ''
    const serverId = typeof item.server_id === 'string' ? item.server_id.trim() : ''
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    if (!key || !serverId || !name) {
      continue
    }

    tools.push({
      key,
      serverId,
      name,
    })
  }

  return tools
}

function normalizeToolStreamInfo(event: AgentStreamEvent): ToolStreamInfo | null {
  const displayName = typeof event.tool === 'string' ? event.tool.trim() : ''
  const runtimeName = typeof event.runtime_name === 'string' ? event.runtime_name.trim() : ''
  const serverId = typeof event.server_id === 'string' ? event.server_id.trim() : ''
  const toolName = typeof event.tool_name === 'string' ? event.tool_name.trim() : ''

  if (!displayName) {
    return null
  }

  return {
    displayName,
    runtimeName: runtimeName || displayName,
    serverId: serverId || 'unknown',
    toolName: toolName || displayName,
    input: event.tool_input,
  }
}

function handleAgentEvent(event: AgentStreamEvent, handlers: StreamEventHandlers): void {
  if (typeof event.thread_id === 'string' && event.thread_id.trim()) {
    handlers.onThreadId?.(event.thread_id)
  }

  switch (event.type) {
    case 'delta': {
      if (typeof event.delta === 'string' && event.delta) {
        handlers.onDelta(event.delta)
      }
      return
    }
    case 'tool_start': {
      const toolInfo = normalizeToolStreamInfo(event)
      if (toolInfo) {
        handlers.onToolStart?.(toolInfo)
      }
      return
    }
    case 'tool_end': {
      const toolInfo = normalizeToolStreamInfo(event)
      if (toolInfo) {
        handlers.onToolEnd?.(toolInfo)
      }
      return
    }
    case 'done': {
      handlers.onSelectedTools?.(normalizeSelectedTools(event.selected_tools))
      return
    }
    case 'error': {
      throw new Error(event.error || ZH_TEXT.errUnknown)
    }
    default:
      return
  }
}

export async function requestAgentReplyStream(input: RequestAssistantReplyStreamInput): Promise<void> {
  const response = await fetch(`${BACKEND_BASE_URL}/agent/chat`, {
    method: 'POST',
    headers: buildHeaders(BACKEND_API_TOKEN),
    body: JSON.stringify({
      thread_id: input.threadId || undefined,
      input: input.input,
      stream: true,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`${ZH_TEXT.errRequestFailed} (${response.status}): ${details || response.statusText}`)
  }

  if (!response.body) {
    throw new Error(ZH_TEXT.errUnknown)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })

    while (true) {
      const boundary = /\r?\n\r?\n/.exec(buffer)
      if (!boundary) {
        break
      }

      const rawEvent = buffer.slice(0, boundary.index)
      buffer = buffer.slice(boundary.index + boundary[0].length)

      const eventData = parseSSEEventData(rawEvent)
      if (!eventData) {
        continue
      }

      if (eventData === '[DONE]') {
        return
      }

      try {
        const event = JSON.parse(eventData) as AgentStreamEvent
        handleAgentEvent(event, input)
      } catch (error) {
        if (error instanceof Error) {
          throw error
        }
      }
    }
  }

  const tail = decoder.decode()
  if (tail) {
    buffer += tail
  }

  const remaining = buffer.trim()
  if (!remaining) {
    return
  }

  const eventData = parseSSEEventData(remaining)
  if (!eventData || eventData === '[DONE]') {
    return
  }

  const event = JSON.parse(eventData) as AgentStreamEvent
  handleAgentEvent(event, input)
}
