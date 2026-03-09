import { useCallback, useEffect, useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import {
  CHAT_MESSAGES_STORAGE_KEY,
  CHAT_THEME_STORAGE_KEY,
  CHAT_THREAD_ID_STORAGE_KEY,
  getSystemTheme,
  parseTheme,
} from '../app/config'
import type {
  ChatMessage,
  ChatMessageToolTrace,
  SelectedToolItem,
  Theme,
  ToolEventLogItem,
  ToolStatusItem,
  ToolStreamInfo,
} from '../app/types'
import { requestAgentReplyStream } from '../services/chatApi'
import { makeId } from '../utils/chat'
import { usePersistentState } from './usePersistentState'
import { useMcpAdmin, type UseMcpAdminResult } from './useMcpAdmin'

type UseChatAppResult = {
  theme: Theme
  messages: ChatMessage[]
  threadId: string
  draft: string
  sending: boolean
  error: string
  streamingMessageId: string | null
  settingsOpen: boolean
  mcp: UseMcpAdminResult
  setDraft: (value: string) => void
  sendMessage: () => Promise<void>
  clearConversation: () => void
  toggleTheme: () => void
  toggleSettings: () => void
  closeSettings: () => void
}

function createEmptyToolTrace(): ChatMessageToolTrace {
  return {
    runningTools: [],
    selectedTools: [],
    events: [],
  }
}

function normalizePersistedToolTrace(input: unknown): ChatMessageToolTrace | undefined {
  if (!input || typeof input !== 'object') {
    return undefined
  }

  const value = input as Partial<ChatMessageToolTrace>

  const runningTools = Array.isArray(value.runningTools)
    ? value.runningTools.filter((item): item is ToolStatusItem => {
        if (!item || typeof item !== 'object') {
          return false
        }

        const row = item as Partial<ToolStatusItem>
        return (
          typeof row.id === 'string'
          && typeof row.name === 'string'
          && (row.state === 'running' || row.state === 'done' || row.state === 'error')
        )
      })
    : []

  const selectedTools = Array.isArray(value.selectedTools)
    ? value.selectedTools.filter((item): item is SelectedToolItem => {
        if (!item || typeof item !== 'object') {
          return false
        }

        const row = item as Partial<SelectedToolItem>
        return typeof row.key === 'string' && typeof row.serverId === 'string' && typeof row.name === 'string'
      })
    : []

  const events = Array.isArray(value.events)
    ? value.events.filter((item): item is ToolEventLogItem => {
        if (!item || typeof item !== 'object') {
          return false
        }

        const row = item as Partial<ToolEventLogItem>
        return typeof row.id === 'string' && typeof row.name === 'string' && (row.phase === 'start' || row.phase === 'end')
      })
    : []

  if (runningTools.length === 0 && selectedTools.length === 0 && events.length === 0) {
    return undefined
  }

  return {
    runningTools,
    selectedTools,
    events,
  }
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
      toolTrace: normalizePersistedToolTrace(record.toolTrace),
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
  const [theme, setTheme] = usePersistentState<Theme>(CHAT_THEME_STORAGE_KEY, getSystemTheme, {
    deserialize: (raw) => parseTheme(raw),
    serialize: (value) => value,
  })
  const [threadId, setThreadId] = usePersistentState<string>(CHAT_THREAD_ID_STORAGE_KEY, '', {
    deserialize: (raw) => raw,
    serialize: (value) => value,
  })
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadPersistedMessages())
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const mcp = useMcpAdmin()
  const mcpRefresh = mcp.refresh

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

  useEffect(() => {
    if (!settingsOpen) {
      return
    }

    void mcpRefresh()
  }, [mcpRefresh, settingsOpen])

  const formatToolInputDetail = useCallback((input: unknown): string => {
    if (input === undefined || input === null) {
      return ''
    }

    try {
      const text = typeof input === 'string' ? input : JSON.stringify(input)
      return text.length > 120 ? `${text.slice(0, 120)}...` : text
    } catch {
      return ''
    }
  }, [])

  const sendMessage = useCallback(async () => {
    const content = draft.trim()
    if (!content || sending) {
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
      toolTrace: createEmptyToolTrace(),
    }
    const requestMessages = [...messages, userMessage]
    const nextMessages = [...requestMessages, assistantMessage]

    const updateAssistantMessage = (updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) => {
        const targetIndex = prev.findIndex((item) => item.id === assistantMessage.id)
        if (targetIndex < 0) {
          return prev
        }

        const next = [...prev]
        next[targetIndex] = updater(next[targetIndex])
        return next
      })
    }

    const onToolStart = (tool: ToolStreamInfo) => {
      const detail = formatToolInputDetail(tool.input)
      const event: ToolEventLogItem = {
        id: makeId('tool-event'),
        phase: 'start',
        name: tool.displayName,
        detail: detail || undefined,
      }

      const runningTool: ToolStatusItem = {
        id: makeId('tool'),
        name: tool.displayName,
        runtimeName: tool.runtimeName,
        serverId: tool.serverId,
        toolName: tool.toolName,
        state: 'running',
        detail: detail || undefined,
      }

      updateAssistantMessage((message) => {
        const trace = message.toolTrace ?? createEmptyToolTrace()
        return {
          ...message,
          toolTrace: {
            ...trace,
            runningTools: [...trace.runningTools, runningTool],
            events: [...trace.events.slice(-15), event],
          },
        }
      })
    }

    const onToolEnd = (tool: ToolStreamInfo) => {
      const event: ToolEventLogItem = {
        id: makeId('tool-event'),
        phase: 'end',
        name: tool.displayName,
      }

      updateAssistantMessage((message) => {
        const trace = message.toolTrace ?? createEmptyToolTrace()
        const runningTools = [...trace.runningTools]

        for (let i = runningTools.length - 1; i >= 0; i -= 1) {
          const sameRuntime = runningTools[i].runtimeName && runningTools[i].runtimeName === tool.runtimeName
          const sameName = runningTools[i].name === tool.displayName
          if ((sameRuntime || sameName) && runningTools[i].state === 'running') {
            runningTools[i] = { ...runningTools[i], state: 'done' }
            return {
              ...message,
              toolTrace: {
                ...trace,
                runningTools,
                events: [...trace.events.slice(-15), event],
              },
            }
          }
        }

        runningTools.push({
          id: makeId('tool'),
          name: tool.displayName,
          runtimeName: tool.runtimeName,
          serverId: tool.serverId,
          toolName: tool.toolName,
          state: 'done',
        })

        return {
          ...message,
          toolTrace: {
            ...trace,
            runningTools,
            events: [...trace.events.slice(-15), event],
          },
        }
      })
    }

    const onSelectedTools = (tools: SelectedToolItem[]) => {
      updateAssistantMessage((message) => {
        const trace = message.toolTrace ?? createEmptyToolTrace()
        return {
          ...message,
          toolTrace: {
            ...trace,
            selectedTools: tools,
          },
        }
      })
    }

    const markRunningToolsError = (detail: string) => {
      updateAssistantMessage((message) => {
        const trace = message.toolTrace
        if (!trace || trace.runningTools.length === 0) {
          return message
        }

        return {
          ...message,
          toolTrace: {
            ...trace,
            runningTools: trace.runningTools.map((item) =>
              item.state === 'running'
                ? {
                    ...item,
                    state: 'error',
                    detail,
                  }
                : item),
          },
        }
      })
    }

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

      updateAssistantMessage((message) => ({
        ...message,
        content: message.content + delta,
      }))
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
      }, 28)
    }

    try {
      await requestAgentReplyStream({
        input: content,
        threadId: threadId || null,
        onThreadId: (nextThreadId) => {
          if (nextThreadId && nextThreadId !== threadId) {
            setThreadId(nextThreadId)
          }
        },
        onDelta: queueDelta,
        onToolStart,
        onToolEnd,
        onSelectedTools,
      })

      if (flushTimer !== null) {
        window.clearTimeout(flushTimer)
        flushTimer = null
      }
      flushDelta()
    } catch (requestError) {
      markRunningToolsError(requestError instanceof Error ? requestError.message : ZH_TEXT.errUnknown)

      setError(requestError instanceof Error ? requestError.message : ZH_TEXT.errUnknown)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (!last || last.id !== assistantMessage.id || last.content.trim()) {
          return prev
        }
        return prev.slice(0, -1)
      })
    } finally {
      if (flushTimer !== null) {
        window.clearTimeout(flushTimer)
      }
      flushDelta()
      setSending(false)
      setStreamingMessageId(null)
    }
  }, [
    draft,
    formatToolInputDetail,
    messages,
    sending,
    setThreadId,
    threadId,
  ])

  const clearConversation = useCallback(() => {
    try {
      window.localStorage.removeItem(CHAT_MESSAGES_STORAGE_KEY)
      window.localStorage.removeItem(CHAT_THREAD_ID_STORAGE_KEY)
    } catch {
      // Ignore remove errors.
    }
    setMessages([])
    setThreadId('')
    setError('')
  }, [setThreadId])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => !prev)
  }, [])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  return {
    theme,
    messages,
    threadId,
    draft,
    sending,
    error,
    streamingMessageId,
    settingsOpen,
    mcp,
    setDraft,
    sendMessage,
    clearConversation,
    toggleTheme,
    toggleSettings,
    closeSettings,
  }
}
