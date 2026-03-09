import type { Theme } from './types'
import { normalizeBackendBaseUrl } from '../utils/chat'

export const CHAT_THEME_STORAGE_KEY = 'chat.theme.v1'
export const CHAT_MESSAGES_STORAGE_KEY = 'chat.messages.v2'
export const CHAT_THREAD_ID_STORAGE_KEY = 'chat.thread-id.v1'

const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8787'
const rawBackendBaseUrl = typeof import.meta.env.VITE_AGENT_BASE_URL === 'string' ? import.meta.env.VITE_AGENT_BASE_URL : ''
const normalizedBackendBaseUrl = normalizeBackendBaseUrl(rawBackendBaseUrl)

export const BACKEND_BASE_URL = normalizedBackendBaseUrl || DEFAULT_BACKEND_BASE_URL
export const BACKEND_API_TOKEN = typeof import.meta.env.VITE_AGENT_API_TOKEN === 'string'
  ? import.meta.env.VITE_AGENT_API_TOKEN.trim()
  : ''

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function parseTheme(input: unknown): Theme {
  return input === 'light' || input === 'dark' ? input : getSystemTheme()
}
