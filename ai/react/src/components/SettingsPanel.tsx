import { useEffect, useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import type { UseMcpAdminResult } from '../hooks/useMcpAdmin'
import { CloseIcon, PlugIcon, SlidersIcon, TerminalIcon } from './icons'
import { McpPanel } from './McpPanel'

type SettingsPanelProps = {
  mcp: UseMcpAdminResult
  onClose: () => void
}

type SettingsSectionKey = 'general' | 'mcp' | 'rpc'

export function SettingsPanel(props: SettingsPanelProps) {
  const [active, setActive] = useState<SettingsSectionKey>('general')

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        props.onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [props])

  return (
    <div className="settings-dialog-overlay" role="presentation" onClick={props.onClose}>
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={ZH_TEXT.settingsTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <aside className="settings-nav">
          <div className="settings-nav-header">
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
          <div className="settings-nav-list">
            <button
              type="button"
              className={`settings-nav-item ${active === 'general' ? 'active' : ''}`}
              onClick={() => setActive('general')}
            >
              <SlidersIcon />
              {ZH_TEXT.settingsTabGeneral}
            </button>
            <button
              type="button"
              className={`settings-nav-item ${active === 'mcp' ? 'active' : ''}`}
              onClick={() => setActive('mcp')}
            >
              <PlugIcon />
              {ZH_TEXT.settingsTabMcp}
            </button>
            <button
              type="button"
              className={`settings-nav-item ${active === 'rpc' ? 'active' : ''}`}
              onClick={() => setActive('rpc')}
            >
              <TerminalIcon />
              {ZH_TEXT.settingsTabRpc}
            </button>
          </div>
        </aside>

        <section className="settings-content">
          {active === 'general' ? (
            <div className="settings-section">
              <div className="settings-section-title">{ZH_TEXT.settingsTabGeneral}</div>
              <div className="settings-card" />
            </div>
          ) : null}

          {active === 'mcp' ? (
            <div className="settings-section">
              <div className="settings-section-title">{ZH_TEXT.settingsTabMcp}</div>
              <McpPanel mcp={props.mcp} mode="admin" />
            </div>
          ) : null}

          {active === 'rpc' ? (
            <div className="settings-section">
              <div className="settings-section-title">{ZH_TEXT.settingsTabRpc}</div>
              <McpPanel mcp={props.mcp} mode="rpc" />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
