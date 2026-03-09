import { useEffect, useMemo, useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import type { UseMcpAdminResult } from '../hooks/useMcpAdmin'

type McpPanelProps = {
  mcp: UseMcpAdminResult
}

function splitByWhitespaceWithQuotes(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .flatMap((line) => line.match(/"[^"]*"|'[^']*'|[^\s]+/g) || [])
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        return token.slice(1, -1)
      }
      return token
    })
}

function splitArgs(raw: string): string[] {
  const text = raw.trim()
  if (!text) {
    return []
  }

  // Support JSON array style input, e.g. ["-y","chrome-devtools-mcp@latest"].
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
      }
    } catch {
      // Fall back to shell-like splitting when input is not valid JSON.
    }
  }

  return splitByWhitespaceWithQuotes(text)
}

export function McpPanel(props: McpPanelProps) {
  const [pluginId, setPluginId] = useState('')
  const [pluginCommand, setPluginCommand] = useState('node')
  const [pluginArgs, setPluginArgs] = useState('src/mcp/demoSmartSiteServer.js')
  const [pluginCwd, setPluginCwd] = useState('')
  const [pluginDescription, setPluginDescription] = useState('')

  const [rpcServerId, setRpcServerId] = useState('')
  const [rpcToolName, setRpcToolName] = useState('')
  const [rpcArgs, setRpcArgs] = useState('{\n  \n}')
  const [rpcLocalError, setRpcLocalError] = useState('')

  useEffect(() => {
    if (!rpcServerId && props.mcp.servers.length > 0) {
      setRpcServerId(props.mcp.servers[0].id)
    }
  }, [props.mcp.servers, rpcServerId])

  const serverOptions = useMemo(
    () => props.mcp.servers.map((server) => ({ value: server.id, label: server.id })),
    [props.mcp.servers],
  )

  const toolOptions = useMemo(
    () => props.mcp.tools.filter((tool) => (rpcServerId ? tool.serverId === rpcServerId : true)),
    [props.mcp.tools, rpcServerId],
  )

  const submitPlugin = async () => {
    if (!pluginId.trim()) {
      return
    }

    await props.mcp.enableServer({
      id: pluginId.trim(),
      command: pluginCommand.trim() || undefined,
      args: splitArgs(pluginArgs),
      cwd: pluginCwd.trim() || undefined,
      description: pluginDescription.trim() || undefined,
      enabled: true,
    })
  }

  const callRpc = async () => {
    setRpcLocalError('')
    props.mcp.clearRpcResult()

    let parsedArgs: Record<string, unknown>
    try {
      const parsed = JSON.parse(rpcArgs) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(ZH_TEXT.mcpRpcInvalidJson)
      }
      parsedArgs = parsed as Record<string, unknown>
    } catch {
      setRpcLocalError(ZH_TEXT.mcpRpcInvalidJson)
      return
    }

    if (!rpcServerId.trim() || !rpcToolName.trim()) {
      return
    }

    await props.mcp.callRpc({
      serverId: rpcServerId.trim(),
      toolName: rpcToolName.trim(),
      arguments: parsedArgs,
    })
  }

  return (
    <div className="mcp-panel">
      <div className="mcp-actions">
        <button type="button" onClick={() => void props.mcp.refresh()} disabled={props.mcp.loading}>
          {ZH_TEXT.mcpRefresh}
        </button>
        <button type="button" onClick={() => void props.mcp.reindex()} disabled={props.mcp.loading}>
          {ZH_TEXT.mcpReindex}
        </button>
      </div>

      <div className="mcp-card">
        <h3>{ZH_TEXT.mcpRouterStatus}</h3>
        <p>
          toolCount: {props.mcp.routerStatus?.toolCount ?? 0} | vectorEnabled:{' '}
          {String(props.mcp.routerStatus?.vectorEnabled ?? false)}
        </p>
        <p>
          embed: {props.mcp.routerStatus?.embedModel ?? '-'} @ {props.mcp.routerStatus?.embedBaseUrl ?? '-'}
        </p>
        {props.mcp.routerStatus?.lastError ? <p className="status-error-inline">{props.mcp.routerStatus.lastError}</p> : null}
      </div>

      <div className="mcp-card">
        <h3>{ZH_TEXT.mcpEnableOrUpdate}</h3>
        <label className="field">
          <span>{ZH_TEXT.mcpServerId}</span>
          <input value={pluginId} onChange={(event) => setPluginId(event.target.value)} placeholder="smart-site-demo" />
        </label>
        <label className="field">
          <span>{ZH_TEXT.mcpCommand}</span>
          <input value={pluginCommand} onChange={(event) => setPluginCommand(event.target.value)} placeholder="node" />
        </label>
        <label className="field">
          <span>{ZH_TEXT.mcpArgs}</span>
          <textarea
            value={pluginArgs}
            onChange={(event) => setPluginArgs(event.target.value)}
            rows={2}
            placeholder={ZH_TEXT.mcpArgsPlaceholder}
          />
        </label>
        <label className="field">
          <span>{ZH_TEXT.mcpCwd}</span>
          <input
            value={pluginCwd}
            onChange={(event) => setPluginCwd(event.target.value)}
            placeholder={ZH_TEXT.mcpOptionalPlaceholder}
          />
        </label>
        <label className="field">
          <span>{ZH_TEXT.mcpDescription}</span>
          <input
            value={pluginDescription}
            onChange={(event) => setPluginDescription(event.target.value)}
            placeholder={ZH_TEXT.mcpOptionalPlaceholder}
          />
        </label>
        <button type="button" onClick={() => void submitPlugin()} disabled={props.mcp.loading || !pluginId.trim()}>
          {ZH_TEXT.mcpEnableOrUpdate}
        </button>
      </div>

      <div className="mcp-card">
        <h3>{ZH_TEXT.mcpServers}</h3>
        {props.mcp.servers.length === 0 ? <p>{ZH_TEXT.mcpNoServer}</p> : null}
        <div className="server-list">
          {props.mcp.servers.map((server) => (
            <div key={server.id} className="server-item">
              <div className="server-meta">
                <div className="server-line">
                  <strong>{server.id}</strong>
                  <span className={`status-chip ${server.active ? 'active' : 'inactive'}`}>
                    {server.active ? 'active' : 'inactive'}
                  </span>
                </div>
                <div className="server-line muted">
                  cmd: {server.command} {server.args.join(' ')}
                </div>
                <div className="server-line muted">
                  pid: {server.pid ?? '-'} | tools: {server.toolCount}
                </div>
                {server.lastError ? <div className="server-line error">{server.lastError}</div> : null}
              </div>
              {server.active ? (
                <button type="button" onClick={() => void props.mcp.disableServer(server.id)} disabled={props.mcp.loading}>
                  {ZH_TEXT.mcpDisable}
                </button>
              ) : (
                <button type="button" onClick={() => void props.mcp.enableServer({ id: server.id })} disabled={props.mcp.loading}>
                  {ZH_TEXT.mcpEnable}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mcp-card">
        <h3>{ZH_TEXT.mcpTools}</h3>
        {props.mcp.tools.length === 0 ? <p>{ZH_TEXT.mcpNoTool}</p> : null}
        <div className="tool-list">
          {props.mcp.tools.map((tool) => (
            <button
              key={tool.key}
              type="button"
              className="tool-item"
              onClick={() => {
                setRpcServerId(tool.serverId)
                setRpcToolName(tool.name)
              }}
            >
              <strong>{tool.name}</strong>
              <span>{tool.serverId}</span>
              {tool.description ? <small>{tool.description}</small> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mcp-card">
        <h3>{ZH_TEXT.mcpRpcTitle}</h3>
        <label className="field">
          <span>{ZH_TEXT.mcpRpcServer}</span>
          <select value={rpcServerId} onChange={(event) => setRpcServerId(event.target.value)}>
            <option value="">{ZH_TEXT.mcpSelectPlaceholder}</option>
            {serverOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{ZH_TEXT.mcpRpcTool}</span>
          <input
            value={rpcToolName}
            onChange={(event) => setRpcToolName(event.target.value)}
            list="mcp-tool-name-list"
            placeholder="query_tower_crane"
          />
          <datalist id="mcp-tool-name-list">
            {toolOptions.map((tool) => (
              <option key={tool.key} value={tool.name} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>{ZH_TEXT.mcpRpcArgs}</span>
          <textarea value={rpcArgs} onChange={(event) => setRpcArgs(event.target.value)} rows={5} />
        </label>
        <button
          type="button"
          onClick={() => void callRpc()}
          disabled={props.mcp.rpcLoading || !rpcServerId.trim() || !rpcToolName.trim()}
        >
          {ZH_TEXT.mcpRpcCall}
        </button>

        {rpcLocalError ? <p className="status-error-inline">{rpcLocalError}</p> : null}
        {props.mcp.rpcResult ? (
          <label className="field">
            <span>{ZH_TEXT.mcpRpcResult}</span>
            <textarea
              readOnly
              rows={7}
              value={JSON.stringify(props.mcp.rpcResult, null, 2)}
            />
          </label>
        ) : null}
      </div>

      {props.mcp.error ? <p className="status-error-inline">{props.mcp.error}</p> : null}
    </div>
  )
}
