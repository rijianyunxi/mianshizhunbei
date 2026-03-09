import { BACKEND_API_TOKEN, BACKEND_BASE_URL } from '../app/config'
import type { ConversationMessage, ConversationSummary } from '../app/types'

function buildHeaders(apiToken: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`
  }

  return headers
}

function normalizeConversationSummary(input: unknown): ConversationSummary | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Record<string, unknown>
  const threadId = typeof value.threadId === 'string' ? value.threadId : ''
  if (!threadId) {
    return null
  }

  return {
    threadId,
    title: typeof value.title === 'string' && value.title.trim() ? value.title : '\u65B0\u5BF9\u8BDD',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
    lastMessage: typeof value.lastMessage === 'string' ? value.lastMessage : '',
    messageCount: typeof value.messageCount === 'number' ? value.messageCount : 0,
  }
}

function normalizeConversationMessage(input: unknown): ConversationMessage | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Record<string, unknown>
  const id = typeof value.id === 'number' ? value.id : 0
  const threadId = typeof value.threadId === 'string' ? value.threadId : ''
  const role = value.role
  if (!id || !threadId || (role !== 'user' && role !== 'assistant')) {
    return null
  }

  return {
    id,
    threadId,
    role,
    content: typeof value.content === 'string' ? value.content : '',
    createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
  }
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(BACKEND_API_TOKEN),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  if (response.status === 204) {
    return null
  }

  return await response.json()
}

export async function listConversations(limit = 100): Promise<ConversationSummary[]> {
  const payload = (await requestJson(`/agent/threads?limit=${limit}`)) as Record<string, unknown>
  if (!Array.isArray(payload.items)) {
    return []
  }

  return payload.items
    .map((item) => normalizeConversationSummary(item))
    .filter((item): item is ConversationSummary => item !== null)
}

export async function createConversation(title?: string): Promise<ConversationSummary> {
  const payload = (await requestJson('/agent/threads', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })) as Record<string, unknown>

  const item = normalizeConversationSummary(payload.item)
  if (!item) {
    throw new Error('invalid conversation payload')
  }

  return item
}

export async function getConversationMessages(threadId: string, limit = 500): Promise<ConversationMessage[]> {
  const payload = (await requestJson(`/agent/threads/${encodeURIComponent(threadId)}/messages?limit=${limit}`)) as Record<string, unknown>
  if (!Array.isArray(payload.items)) {
    return []
  }

  return payload.items
    .map((item) => normalizeConversationMessage(item))
    .filter((item): item is ConversationMessage => item !== null)
}

export async function deleteConversation(threadId: string): Promise<void> {
  await requestJson(`/agent/threads/${encodeURIComponent(threadId)}`, {
    method: 'DELETE',
  })
}
