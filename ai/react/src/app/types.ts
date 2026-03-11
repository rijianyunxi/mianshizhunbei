export type Role = 'user' | 'assistant'
export type Theme = 'light' | 'dark'

export type ChatMessage = {
  id: string
  role: Role
  content: string
  toolTrace?: ChatMessageToolTrace
  createdAt?: number
}

export type ChatSettings = {
  providerId: string
  apiUrl: string
  apiKey: string
  model: string
  systemPrompt: string
}

export type ChatRequestMessage = {
  role: Role | 'system'
  content: string
}

export type ToolStatusState = 'running' | 'done' | 'error'

export type ToolStatusItem = {
  id: string
  name: string
  state: ToolStatusState
  runtimeName?: string
  serverId?: string
  toolName?: string
  detail?: string
}

export type SelectedToolItem = {
  key: string
  serverId: string
  name: string
}

export type ToolStreamInfo = {
  displayName: string
  runtimeName: string
  serverId: string
  toolName: string
  input?: unknown
}

export type ToolEventLogItem = {
  id: string
  phase: 'start' | 'end'
  name: string
  detail?: string
}

export type ChatMessageToolTrace = {
  runningTools: ToolStatusItem[]
  selectedTools: SelectedToolItem[]
  events: ToolEventLogItem[]
}

export type McpServerState = {
  id: string
  command: string
  args: string[]
  cwd?: string
  description?: string
  enabled: boolean
  active: boolean
  pid: number | null
  toolCount: number
  connectedAt: string | null
  lastError: string | null
}

export type ToolRouterStatus = {
  toolCount: number
  vectorEnabled: boolean
  topK: number
  embedModel: string
  embedBaseUrl: string
  lastError: string | null
}

export type McpToolDescriptor = {
  key: string
  runtimeName: string
  serverId: string
  name: string
  description: string
  inputSchema?: Record<string, unknown>
}

export type McpEnableInput = {
  id: string
  command?: string
  args?: string[]
  cwd?: string
  description?: string
  enabled?: boolean
  env?: Record<string, string>
}

export type RpcCallInput = {
  serverId: string
  toolName: string
  arguments: Record<string, unknown>
}

export type RpcCallResult = {
  ok: boolean
  text?: string
  raw?: unknown
  error?: string
}

export type ConversationSummary = {
  threadId: string
  title: string
  createdAt: number
  updatedAt: number
  lastMessage: string
  messageCount: number
}

export type ConversationMessage = {
  id: number
  threadId: string
  role: Role
  content: string
  createdAt: number
}
