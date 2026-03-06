import { ZH_TEXT } from '../app/copy'
import type { ChatMessage, ChatSettings } from '../app/types'
import type { ChatProviderAdapter } from './provider'
import { normalizeApiUrl } from '../utils/chat'

export function validateChatSettings(settings: ChatSettings): string | null {
  if (!normalizeApiUrl(settings.apiUrl)) {
    return ZH_TEXT.errApiUrlRequired
  }
  if (!settings.model.trim()) {
    return ZH_TEXT.errModelRequired
  }
  if (!settings.apiKey.trim()) {
    return ZH_TEXT.errApiKeyRequired
  }
  return null
}

type RequestAssistantReplyInput = {
  settings: ChatSettings
  messages: ChatMessage[]
  provider: ChatProviderAdapter
}

type RequestAssistantReplyStreamInput = RequestAssistantReplyInput & {
  onDelta: (delta: string) => void
}

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

export async function requestAssistantReply(input: RequestAssistantReplyInput): Promise<string> {
  const endpoint = input.provider.buildEndpoint(normalizeApiUrl(input.settings.apiUrl))
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.settings.apiKey.trim()}`,
    },
    body: JSON.stringify(input.provider.buildPayload(input.settings, input.messages, { stream: false })),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`${ZH_TEXT.errRequestFailed} (${response.status}): ${details || response.statusText}`)
  }

  const payload = (await response.json()) as unknown
  return input.provider.parseText(payload)
}

export async function requestAssistantReplyStream(input: RequestAssistantReplyStreamInput): Promise<void> {
  const endpoint = input.provider.buildEndpoint(normalizeApiUrl(input.settings.apiUrl))
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.settings.apiKey.trim()}`,
    },
    body: JSON.stringify(input.provider.buildPayload(input.settings, input.messages, { stream: true })),
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
        const payload = JSON.parse(eventData) as unknown
        const delta = input.provider.parseStreamDelta(payload)
        if (delta) {
          input.onDelta(delta)

          console.log(111,delta);

        }
      } catch {
        // Ignore partial or malformed SSE data segments.
      }
    }
  }

  const lastChunk = decoder.decode()
  if (lastChunk) {
    buffer += lastChunk
  }

  const remaining = buffer.trim()
  if (!remaining) {
    return
  }

  const eventData = parseSSEEventData(remaining)
  if (eventData && eventData !== '[DONE]') {
    try {
      const payload = JSON.parse(eventData) as unknown
      const delta = input.provider.parseStreamDelta(payload)
      if (delta) {
        input.onDelta(delta)
      }
      return
    } catch {
      // Fallback to raw JSON parse below.
    }
  }

  try {
    const payload = JSON.parse(remaining) as unknown
    const text = input.provider.parseText(payload)
    if (text) {
      input.onDelta(text)
    }
  } catch {
    // Ignore tail noise when stream is already closed.
  }
}
