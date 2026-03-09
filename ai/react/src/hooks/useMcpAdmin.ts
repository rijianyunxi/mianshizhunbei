import { useCallback, useState } from 'react'
import type {
  McpEnableInput,
  McpServerState,
  McpToolDescriptor,
  RpcCallInput,
  RpcCallResult,
  ToolRouterStatus,
} from '../app/types'
import {
  callMcpRpc,
  disableMcpServer,
  enableMcpServer,
  listMcpServers,
  listMcpTools,
  reindexMcpTools,
} from '../services/mcpAdminApi'

export type UseMcpAdminResult = {
  servers: McpServerState[]
  tools: McpToolDescriptor[]
  routerStatus: ToolRouterStatus | null
  loading: boolean
  rpcLoading: boolean
  error: string
  rpcResult: RpcCallResult | null
  refresh: () => Promise<void>
  enableServer: (input: McpEnableInput) => Promise<void>
  disableServer: (serverId: string) => Promise<void>
  reindex: () => Promise<void>
  callRpc: (input: RpcCallInput) => Promise<void>
  clearRpcResult: () => void
}

export function useMcpAdmin(): UseMcpAdminResult {
  const [servers, setServers] = useState<McpServerState[]>([])
  const [tools, setTools] = useState<McpToolDescriptor[]>([])
  const [routerStatus, setRouterStatus] = useState<ToolRouterStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [rpcLoading, setRpcLoading] = useState(false)
  const [error, setError] = useState('')
  const [rpcResult, setRpcResult] = useState<RpcCallResult | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [serversPayload, toolsPayload] = await Promise.all([
        listMcpServers(),
        listMcpTools(),
      ])

      setServers(serversPayload.servers)
      setTools(toolsPayload.tools)
      setRouterStatus(serversPayload.router ?? toolsPayload.router)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError))
    } finally {
      setLoading(false)
    }
  }, [])

  const enableServer = useCallback(async (payload: McpEnableInput) => {
    setLoading(true)
    setError('')

    try {
      await enableMcpServer(payload)
      await refresh()
    } catch (enableError) {
      setError(enableError instanceof Error ? enableError.message : String(enableError))
      setLoading(false)
    }
  }, [refresh])

  const disableServer = useCallback(async (serverId: string) => {
    setLoading(true)
    setError('')

    try {
      await disableMcpServer(serverId)
      await refresh()
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : String(disableError))
      setLoading(false)
    }
  }, [refresh])

  const reindex = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      await reindexMcpTools()
      await refresh()
    } catch (reindexError) {
      setError(reindexError instanceof Error ? reindexError.message : String(reindexError))
      setLoading(false)
    }
  }, [refresh])

  const callRpc = useCallback(async (payload: RpcCallInput) => {
    setRpcLoading(true)
    setError('')

    try {
      const result = await callMcpRpc(payload)
      setRpcResult(result)
    } catch (rpcError) {
      const message = rpcError instanceof Error ? rpcError.message : String(rpcError)
      setError(message)
      setRpcResult({ ok: false, error: message })
    } finally {
      setRpcLoading(false)
    }
  }, [])

  const clearRpcResult = useCallback(() => {
    setRpcResult(null)
  }, [])

  return {
    servers,
    tools,
    routerStatus,
    loading,
    rpcLoading,
    error,
    rpcResult,
    refresh,
    enableServer,
    disableServer,
    reindex,
    callRpc,
    clearRpcResult,
  }
}
