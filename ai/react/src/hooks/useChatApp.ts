import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import {
  CHAT_THEME_STORAGE_KEY,
  CHAT_THREAD_ID_STORAGE_KEY,
  getSystemTheme,
  parseTheme,
} from '../app/config'
import type {
  ChatMessage,
  ChatMessageToolTrace,
  ConversationMessage,
  ConversationSummary,
  SelectedToolItem,
  Theme,
  ToolEventLogItem,
  ToolStatusItem,
  ToolStreamInfo,
} from '../app/types'
import { requestAgentReplyStream } from '../services/chatApi'
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  listConversations,
} from '../services/conversationApi'
import { makeId } from '../utils/chat'
import { usePersistentState } from './usePersistentState'
import { useMcpAdmin, type UseMcpAdminResult } from './useMcpAdmin'

type UseChatAppResult = {
  theme: Theme
  conversations: ConversationSummary[]
  conversationsLoading: boolean
  messagesLoading: boolean
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
  stopStreaming: () => void
  clearConversation: () => void
  createConversation: () => Promise<void>
  selectConversation: (threadId: string) => Promise<void>
  deleteConversation: (threadId: string) => Promise<void>
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

function toChatMessage(row: ConversationMessage): ChatMessage {
  return {
    id: `srv-${row.id}`,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt,
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

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const mcp = useMcpAdmin()
  const mcpRefresh = mcp.refresh

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const refreshConversations = useCallback(async () => {
    const items = await listConversations(200)
    setConversations(items)
    return items
  }, [])

  const loadThreadMessages = useCallback(async (nextThreadId: string) => {
    if (!nextThreadId) {
      setMessages([])
      return
    }

    setMessagesLoading(true)
    try {
      const rows = await getConversationMessages(nextThreadId, 800)
      setMessages(rows.map((row) => toChatMessage(row)))
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      setConversationsLoading(true)
      setError('')
      try {
        const items = await listConversations(200)
        if (!active) {
          return
        }

        setConversations(items)

        const hasStoredThread = threadId && items.some((item) => item.threadId === threadId)
        const initialThreadId = hasStoredThread ? threadId : items[0]?.threadId || ''

        if (!initialThreadId) {
          setThreadId('')
          setMessages([])
          return
        }

        setThreadId(initialThreadId)
        setMessagesLoading(true)
        const rows = await getConversationMessages(initialThreadId, 800)
        if (!active) {
          return
        }
        setMessages(rows.map((row) => toChatMessage(row)))
      } catch (bootstrapError) {
        if (!active) {
          return
        }
        setError(bootstrapError instanceof Error ? bootstrapError.message : ZH_TEXT.conversationLoadFailed)
      } finally {
        if (!active) {
          return
        }
        setConversationsLoading(false)
        setMessagesLoading(false)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
    // only bootstrap once with initial persisted thread id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!settingsOpen) {
      return
    }

    void mcpRefresh()
  }, [mcpRefresh, settingsOpen])

  const createConversationAction = useCallback(async () => {
    if (sending) {
      return
    }

    try {
      setError('')
      const created = await createConversation()
      setConversations((prev) => [created, ...prev.filter((item) => item.threadId !== created.threadId)])
      setThreadId(created.threadId)
      setMessages([])
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : ZH_TEXT.errUnknown)
    }
  }, [sending, setThreadId])

  const selectConversation = useCallback(async (nextThreadId: string) => {
    if (!nextThreadId || sending || nextThreadId === threadId) {
      return
    }

    try {
      setError('')
      setThreadId(nextThreadId)
      await loadThreadMessages(nextThreadId)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : ZH_TEXT.errUnknown)
    }
  }, [loadThreadMessages, sending, setThreadId, threadId])

  const deleteConversationAction = useCallback(async (targetThreadId: string) => {
    if (!targetThreadId || sending) {
      return
    }

    try {
      setError('')
      await deleteConversation(targetThreadId)

      const remaining = sortedConversations.filter((item) => item.threadId !== targetThreadId)
      setConversations(remaining)

      if (threadId !== targetThreadId) {
        return
      }

      const nextThreadId = remaining[0]?.threadId || ''
      setThreadId(nextThreadId)
      if (!nextThreadId) {
        setMessages([])
        return
      }

      await loadThreadMessages(nextThreadId)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : ZH_TEXT.errUnknown)
      return
    }
  }, [loadThreadMessages, sending, setThreadId, sortedConversations, threadId])

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

  const shouldRetryStreamOnce = useCallback((error: unknown): boolean => {
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : ''
    if (!message) {
      return false
    }
    return /ERR_CONNECTION_RESET|Failed to fetch|NetworkError|socket hang up/i.test(message)
  }, [])

  const sendMessage = useCallback(async () => {
    const content = draft.trim()
    if (!content || sending) {
      return
    }

    setError('')

    let activeThreadId = threadId
    if (!activeThreadId) {
      const created = await createConversation()
      activeThreadId = created.threadId
      setThreadId(activeThreadId)
      setConversations((prev) => [created, ...prev.filter((item) => item.threadId !== created.threadId)])
    }

    const userMessage: ChatMessage = {
      id: makeId('user'),
      role: 'user',
      content,
      createdAt: Date.now(),
    }
    const assistantMessage: ChatMessage = {
      id: makeId('assistant'),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      toolTrace: createEmptyToolTrace(),
    }

    const nextMessages = [...messages, userMessage, assistantMessage]

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

    let receivedActivity = false

    const onToolStart = (tool: ToolStreamInfo) => {
      receivedActivity = true
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
      receivedActivity = true
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
      receivedActivity = true
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

      receivedActivity = true
      queuedDelta += delta
      if (flushTimer !== null) {
        return
      }

      flushTimer = window.setTimeout(() => {
        flushTimer = null
        flushDelta()
      }, 28)
    }

    const abortController = new AbortController()
    abortRef.current = abortController

    const isAbortError = (error: unknown) => {
      if (!error) {
        return false
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        return true
      }
      if (error instanceof Error && error.name === 'AbortError') {
        return true
      }
      return false
    }

    try {
      let attempt = 0

      while (true) {
        receivedActivity = false
        try {
          await requestAgentReplyStream({
            input: content,
            threadId: activeThreadId || null,
            signal: abortController.signal,
            onThreadId: (nextThreadId) => {
              if (nextThreadId && nextThreadId !== activeThreadId) {
                activeThreadId = nextThreadId
                setThreadId(nextThreadId)
              }
            },
            onDelta: queueDelta,
            onToolStart,
            onToolEnd,
            onSelectedTools,
          })
          break
        } catch (error) {
          if (isAbortError(error)) {
            throw error
          }
          if (attempt === 0 && !receivedActivity && shouldRetryStreamOnce(error)) {
            attempt += 1
            continue
          }
          throw error
        }
      }

      if (flushTimer !== null) {
        window.clearTimeout(flushTimer)
        flushTimer = null
      }
      flushDelta()

      const items = await refreshConversations()
      if (activeThreadId && !items.some((item) => item.threadId === activeThreadId)) {
        setThreadId(activeThreadId)
      }
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        markRunningToolsError(requestError instanceof Error ? requestError.message : ZH_TEXT.errUnknown)
        setError(requestError instanceof Error ? requestError.message : ZH_TEXT.errUnknown)
      }
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
      if (abortRef.current === abortController) {
        abortRef.current = null
      }
    }
  }, [
    draft,
    formatToolInputDetail,
    messages,
    refreshConversations,
    sending,
    shouldRetryStreamOnce,
    setThreadId,
    threadId,
  ])

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  const clearConversation = useCallback(() => {
    if (!threadId || sending) {
      setMessages([])
      return
    }

    void deleteConversationAction(threadId)
  }, [deleteConversationAction, sending, threadId])

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
    conversations: sortedConversations,
    conversationsLoading,
    messagesLoading,
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
    stopStreaming,
    clearConversation,
    createConversation: createConversationAction,
    selectConversation,
    deleteConversation: deleteConversationAction,
    toggleTheme,
    toggleSettings,
    closeSettings,
  }
}
