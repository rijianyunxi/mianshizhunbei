import { ZH_TEXT } from '../app/copy'

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '')
}

export function normalizeBackendBaseUrl(apiUrl: string): string {
  const normalized = normalizeApiUrl(apiUrl)
  if (!normalized) {
    return ''
  }
  if (normalized.endsWith('/v1')) {
    return normalized.slice(0, -3)
  }
  return normalized
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text
        }
        return ''
      })
      .join('')
  }

  return ''
}

export function extractAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return ZH_TEXT.errUnknown
  }

  const output = payload as {
    choices?: Array<{ message?: { content?: unknown } }>
    output_text?: string
    reply?: string
  }

  if (typeof output.reply === 'string' && output.reply.trim()) {
    return output.reply.trim()
  }

  if (typeof output.output_text === 'string' && output.output_text.trim()) {
    return output.output_text.trim()
  }

  const messageContent = output.choices?.[0]?.message?.content
  const text = extractTextFromContent(messageContent).trim()
  if (text) {
    return text
  }

  return ZH_TEXT.errUnknown
}

export function extractAssistantStreamDelta(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const output = payload as {
    choices?: Array<{
      delta?: { content?: unknown }
      message?: { content?: unknown }
    }>
    output_text?: string
    delta?: string
  }

  if (typeof output.delta === 'string') {
    return output.delta
  }

  if (typeof output.output_text === 'string') {
    return output.output_text
  }

  const deltaContent = output.choices?.[0]?.delta?.content
  const deltaText = extractTextFromContent(deltaContent)
  if (deltaText) {
    return deltaText
  }

  const fallbackMessageContent = output.choices?.[0]?.message?.content
  return extractTextFromContent(fallbackMessageContent)
}
