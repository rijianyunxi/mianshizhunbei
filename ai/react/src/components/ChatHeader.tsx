import { ZH_TEXT } from '../app/copy'
import type { Theme } from '../app/types'
import { SettingsIcon, ThemeIcon } from './icons'

type ChatHeaderProps = {
  modelName: string
  settingsOpen: boolean
  theme: Theme
  onToggleSettings: () => void
  onToggleTheme: () => void
}

export function ChatHeader(props: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <h1>{ZH_TEXT.title}</h1>
        <p>{props.modelName || ZH_TEXT.noModel}</p>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={props.onToggleSettings}
          aria-label={props.settingsOpen ? ZH_TEXT.ariaCloseSettings : ZH_TEXT.ariaOpenSettings}
          title={props.settingsOpen ? ZH_TEXT.ariaCloseSettings : ZH_TEXT.ariaOpenSettings}
        >
          <SettingsIcon open={props.settingsOpen} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={props.onToggleTheme}
          aria-label={props.theme === 'dark' ? ZH_TEXT.ariaSwitchToLight : ZH_TEXT.ariaSwitchToDark}
          title={props.theme === 'dark' ? ZH_TEXT.ariaSwitchToLight : ZH_TEXT.ariaSwitchToDark}
        >
          <ThemeIcon theme={props.theme} />
        </button>
      </div>
    </header>
  )
}
