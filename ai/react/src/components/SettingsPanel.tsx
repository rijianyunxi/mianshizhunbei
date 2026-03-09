import { ZH_TEXT } from '../app/copy'
import type { UseMcpAdminResult } from '../hooks/useMcpAdmin'
import { CloseIcon } from './icons'
import { McpPanel } from './McpPanel'

type SettingsPanelProps = {
  threadId: string
  mcp: UseMcpAdminResult
  onClose: () => void
  onClearConversation: () => void
}

export function SettingsPanel(props: SettingsPanelProps) {
  return (
    <aside className="settings-panel">
      <div className="panel-header">
        <h2>{ZH_TEXT.settingsTitle}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={props.onClose}
          aria-label={ZH_TEXT.ariaCloseSettings}
          title={ZH_TEXT.ariaCloseSettings}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="mcp-card">
        <h3>{ZH_TEXT.backendManagedTitle}</h3>
        <p>{ZH_TEXT.backendManagedDescription}</p>
        <label className="field">
          <span>{ZH_TEXT.threadId}</span>
          <input type="text" value={props.threadId || ZH_TEXT.noThread} readOnly />
        </label>
        <button type="button" className="clear-chat-button" onClick={props.onClearConversation}>
          {ZH_TEXT.clearConversation}
        </button>
      </div>

      <McpPanel mcp={props.mcp} />
    </aside>
  )
}
