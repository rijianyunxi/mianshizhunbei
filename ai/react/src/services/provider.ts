import type { ChatMessage, ChatRequestMessage, ChatSettings } from '../app/types'
import { extractAssistantStreamDelta, extractAssistantText } from '../utils/chat'

type BuildPayloadOptions = {
  stream: boolean
}

export type ChatProviderAdapter = {
  id: string
  label: string
  buildEndpoint: (apiUrl: string) => string
  buildPayload: (
    settings: ChatSettings,
    messages: ChatMessage[],
    options: BuildPayloadOptions,
  ) => Record<string, unknown>
  parseText: (payload: unknown) => string
  parseStreamDelta: (payload: unknown) => string
}

function buildRequestMessages(settings: ChatSettings, messages: ChatMessage[]): ChatRequestMessage[] {
  const requestMessages: ChatRequestMessage[] = []
  if (settings.systemPrompt.trim()) {
    requestMessages.push({ role: 'system', content: settings.systemPrompt.trim() })
  }
  requestMessages.push(...messages.map((item) => ({ role: item.role, content: item.content })))
  return requestMessages
}

export const openAICompatibleProvider: ChatProviderAdapter = {
  id: 'openai-compatible',
  label: 'OpenAI Compatible',
  buildEndpoint: (apiUrl) => `${apiUrl}/chat/completions`,
  buildPayload: (settings, messages, options) => ({
    model: settings.model.trim(),
    messages: buildRequestMessages(settings, messages),
    stream: options.stream,
  }),
  parseText: (payload) => extractAssistantText(payload),
  parseStreamDelta: (payload) => extractAssistantStreamDelta(payload),
}
