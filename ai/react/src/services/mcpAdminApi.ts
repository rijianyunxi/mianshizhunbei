import { BACKEND_API_TOKEN, BACKEND_BASE_URL } from '../app/config'
import type {
  McpEnableInput,
  McpServerState,
  McpToolDescriptor,
  RpcCallInput,
  RpcCallResult,
  ToolRouterStatus,
} from '../app/types'

function buildHeaders(apiToken: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`
  }

  return headers
}

function normalizeServer(input: unknown): McpServerState | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Record<string, unknown>
  const id = typeof value.id === 'string' ? value.id : ''
  const command = typeof value.command === 'string' ? value.command : ''
  if (!id || !command) {
    return null
  }

  return {
    id,
    command,
    args: Array.isArray(value.args) ? value.args.filter((item): item is string => typeof item === 'string') : [],
    cwd: typeof value.cwd === 'string' ? value.cwd : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
    enabled: Boolean(value.enabled),
    active: Boolean(value.active),
    pid: typeof value.pid === 'number' ? value.pid : null,
    toolCount: typeof value.toolCount === 'number' ? value.toolCount : 0,
    connectedAt: typeof value.connectedAt === 'string' ? value.connectedAt : null,
    lastError: typeof value.lastError === 'string' ? value.lastError : null,
  }
}

function normalizeRouterStatus(input: unknown): ToolRouterStatus | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Record<string, unknown>
  if (
    typeof value.toolCount !== 'number' ||
    typeof value.vectorEnabled !== 'boolean' ||
    typeof value.topK !== 'number' ||
    typeof value.embedModel !== 'string' ||
    typeof value.embedBaseUrl !== 'string'
  ) {
    return null
  }

  return {
    toolCount: value.toolCount,
    vectorEnabled: value.vectorEnabled,
    topK: value.topK,
    embedModel: value.embedModel,
    embedBaseUrl: value.embedBaseUrl,
    lastError: typeof value.lastError === 'string' ? value.lastError : null,
  }
}

function normalizeTool(input: unknown): McpToolDescriptor | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const value = input as Record<string, unknown>
  const key = typeof value.key === 'string' ? value.key : ''
  const runtimeName = typeof value.runtime_name === 'string' ? value.runtime_name : ''
  const serverId = typeof value.server_id === 'string' ? value.server_id : ''
  const name = typeof value.name === 'string' ? value.name : ''

  if (!key || !runtimeName || !serverId || !name) {
    return null
  }

  return {
    key,
    runtimeName,
    serverId,
    name,
    description: typeof value.description === 'string' ? value.description : '',
  }
}

async function requestJson(path: string, method: 'GET' | 'POST', body?: unknown): Promise<unknown> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(BACKEND_API_TOKEN),
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return (await response.json()) as unknown
}

export async function listMcpServers(): Promise<{ servers: McpServerState[]; router: ToolRouterStatus | null }> {
  const payload = (await requestJson('/admin/mcp/servers', 'GET')) as Record<string, unknown>
  const servers = Array.isArray(payload.servers)
    ? payload.servers.map((item) => normalizeServer(item)).filter((item): item is McpServerState => item !== null)
    : []

  return {
    servers,
    router: normalizeRouterStatus(payload.router),
  }
}

export async function listMcpTools(): Promise<{ tools: McpToolDescriptor[]; router: ToolRouterStatus | null }> {
  const payload = (await requestJson('/admin/mcp/tools', 'GET')) as Record<string, unknown>
  const tools = Array.isArray(payload.tools)
    ? payload.tools.map((item) => normalizeTool(item)).filter((item): item is McpToolDescriptor => item !== null)
    : []

  return {
    tools,
    router: normalizeRouterStatus(payload.router),
  }
}

export async function enableMcpServer(input: McpEnableInput): Promise<void> {
  await requestJson('/admin/mcp/servers/enable', 'POST', {
    id: input.id,
    command: input.command,
    args: input.args,
    cwd: input.cwd,
    description: input.description,
    enabled: input.enabled,
    env: input.env,
  })
}

export async function disableMcpServer(serverId: string): Promise<void> {
  await requestJson('/admin/mcp/servers/disable', 'POST', {
    id: serverId,
  })
}

export async function reindexMcpTools(): Promise<void> {
  await requestJson('/admin/mcp/reindex', 'POST', {})
}

export async function callMcpRpc(input: RpcCallInput): Promise<RpcCallResult> {
  const payload = (await requestJson('/rpc/mcp/call', 'POST', {
    server_id: input.serverId,
    tool_name: input.toolName,
    arguments: input.arguments,
  })) as Record<string, unknown>

  return {
    ok: Boolean(payload.ok),
    text: typeof payload.text === 'string' ? payload.text : undefined,
    raw: payload.raw,
    error: typeof payload.error === 'string' ? payload.error : undefined,
  }
}
