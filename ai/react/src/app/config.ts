import type { ChatSettings, Theme } from './types'

export const PRESET_MODELS = ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o3-mini'] as const
export const CUSTOM_MODEL_VALUE = '__custom__'

export const CHAT_SETTINGS_STORAGE_KEY = 'chat.settings.v2'
export const CHAT_THEME_STORAGE_KEY = 'chat.theme.v1'
export const CHAT_MESSAGES_STORAGE_KEY = 'chat.messages.v1'

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  providerId: 'openai-compatible',
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-mini',
  systemPrompt: '你是一个乐于助人的助手。',
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function normalizeChatSettings(input: Partial<ChatSettings> | null | undefined): ChatSettings {
  return {
    providerId: input?.providerId?.trim() || DEFAULT_CHAT_SETTINGS.providerId,
    apiUrl: input?.apiUrl?.trim() || DEFAULT_CHAT_SETTINGS.apiUrl,
    apiKey: input?.apiKey?.trim() || '',
    model: input?.model?.trim() || DEFAULT_CHAT_SETTINGS.model,
    systemPrompt: input?.systemPrompt?.trim() || DEFAULT_CHAT_SETTINGS.systemPrompt,
  }
}

export function parseTheme(input: unknown): Theme {
  return input === 'light' || input === 'dark' ? input : getSystemTheme()
}

export function isPresetModel(model: string): boolean {
  return PRESET_MODELS.includes(model as (typeof PRESET_MODELS)[number])
}
