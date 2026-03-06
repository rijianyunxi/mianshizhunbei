import { useCallback, useEffect, useMemo, useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import {
  CHAT_MESSAGES_STORAGE_KEY,
  CHAT_SETTINGS_STORAGE_KEY,
  CHAT_THEME_STORAGE_KEY,
  CUSTOM_MODEL_VALUE,
  DEFAULT_CHAT_SETTINGS,
  getSystemTheme,
  isPresetModel,
  normalizeChatSettings,
  parseTheme,
} from '../app/config'
import type { ChatMessage, ChatSettings, Theme } from '../app/types'
import { requestAssistantReplyStream, validateChatSettings } from '../services/chatApi'
import { getChatProvider } from '../services/providerRegistry'
import { makeId } from '../utils/chat'
import { usePersistentState } from './usePersistentState'

type UseChatAppResult = {
  settings: ChatSettings
  theme: Theme
  messages: ChatMessage[]
  draft: string
  sending: boolean
  error: string
  streamingMessageId: string | null
  settingsOpen: boolean
  customModelMode: boolean
  modelSelectValue: string
  setDraft: (value: string) => void
  updateSettings: (patch: Partial<ChatSettings>) => void
  selectModel: (value: string) => void
  sendMessage: () => Promise<void>
  clearConversation: () => void
  toggleTheme: () => void
  toggleSettings: () => void
  closeSettings: () => void
}

function normalizePersistedMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) {
    return []
  }

  const messages: ChatMessage[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const record = item as Partial<ChatMessage>
    const role = record.role
    if (role !== 'user' && role !== 'assistant') {
      continue
    }

    if (typeof record.id !== 'string' || typeof record.content !== 'string') {
      continue
    }

    messages.push({
      id: record.id,
      role,
      content: record.content,
    })
  }

  return messages
}

function loadPersistedMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY)
    if (!raw) {
      return []
    }
    return normalizePersistedMessages(JSON.parse(raw) as unknown)
  } catch {
    return []
  }
}

function persistMessages(messages: ChatMessage[]): void {
  try {
    window.localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    try {
      window.localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages.slice(-200)))
    } catch {
      // Ignore quota errors and keep runtime messages only.
    }
  }
}

export function useChatApp(): UseChatAppResult {
  const [settings, setSettings] = usePersistentState<ChatSettings>(
    CHAT_SETTINGS_STORAGE_KEY,
    DEFAULT_CHAT_SETTINGS,
    {
      deserialize: (raw) => normalizeChatSettings(JSON.parse(raw) as Partial<ChatSettings>),
    },
  )
  const [theme, setTheme] = usePersistentState<Theme>(CHAT_THEME_STORAGE_KEY, getSystemTheme, {
    deserialize: (raw) => parseTheme(raw),
    serialize: (value) => value,
  })
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadPersistedMessages())
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [customModelMode, setCustomModelMode] = useState(() => !isPresetModel(settings.model))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      persistMessages(messages)
    }, 120)

    return () => {
      window.clearTimeout(timer)
    }
  }, [messages])

  const updateSettings = useCallback((patch: Partial<ChatSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [setSettings])

  const selectModel = useCallback((value: string) => {
    if (value === CUSTOM_MODEL_VALUE) {
      setCustomModelMode(true)
      setSettings((prev) => ({
        ...prev,
        model: isPresetModel(prev.model) ? '' : prev.model,
      }))
      return
    }

    setCustomModelMode(false)
    setSettings((prev) => ({ ...prev, model: value }))
  }, [setSettings])

  const sendMessage = useCallback(async () => {
    const content = draft.trim()
    if (!content || sending) {
      return
    }

    const validationError = validateChatSettings(settings)
    if (validationError) {
      setError(validationError)
      return
    }

    const userMessage: ChatMessage = {
      id: makeId('user'),
      role: 'user',
      content,
    }
    const assistantMessage: ChatMessage = {
      id: makeId('assistant'),
      role: 'assistant',
      content: '',
    }
    const requestMessages = [...messages, userMessage]
    const nextMessages = [...requestMessages, assistantMessage]

    setMessages(nextMessages)
    setDraft('')
    setError('')
    setSending(true)
    setStreamingMessageId(assistantMessage.id)

    let queuedDelta = ''
    let flushTimer: number | null = null

    const flushDelta = () => {
      if (!queuedDelta) {
        return
      }

      const delta = queuedDelta
      queuedDelta = ''

      setMessages((prev) => {
        let targetIndex = -1
        for (let i = prev.length - 1; i >= 0; i -= 1) {
          if (prev[i].id === assistantMessage.id) {
            targetIndex = i
            break
          }
        }

        if (targetIndex === -1) {
          return prev
        }

        const target = prev[targetIndex]
        const updated = { ...target, content: target.content + delta }
        const next = [...prev]
        next[targetIndex] = updated
        return next
      })
    }

    const queueDelta = (delta: string) => {
      if (!delta) {
        return
      }

      queuedDelta += delta
      if (flushTimer !== null) {
        return
      }

      flushTimer = window.setTimeout(() => {
        flushTimer = null
        flushDelta()
      }, 32)
    }

    try {
      const provider = getChatProvider(settings.providerId)
      await requestAssistantReplyStream({
        settings,
        messages: requestMessages,
        provider,
        onDelta: queueDelta,
      })
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer)
        flushTimer = null
      }
      flushDelta()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : ZH_TEXT.errUnknown)
    } finally {
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer)
      }
      flushDelta()
      setSending(false)
      setStreamingMessageId(null)
    }
  }, [draft, messages, sending, settings])

  const clearConversation = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY)
    } catch {
      // Ignore remove errors.
    }
    setMessages([])
    setError('')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => !prev)
  }, [])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  const modelSelectValue = useMemo(
    () => (customModelMode ? CUSTOM_MODEL_VALUE : settings.model),
    [customModelMode, settings.model],
  )

  return {
    settings,
    theme,
    messages,
    draft,
    sending,
    error,
    streamingMessageId,
    settingsOpen,
    customModelMode,
    modelSelectValue,
    setDraft,
    updateSettings,
    selectModel,
    sendMessage,
    clearConversation,
    toggleTheme,
    toggleSettings,
    closeSettings,
  }
}
