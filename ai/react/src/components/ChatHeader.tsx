import { ZH_TEXT } from '../app/copy'
import type { Theme } from '../app/types'
import { GearIcon, SidebarIcon, ThemeIcon } from './icons'

type ChatHeaderProps = {
  threadId: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  settingsOpen: boolean
  onToggleSettings: () => void
  theme: Theme
  onToggleTheme: () => void
}

export function ChatHeader(props: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div className="header-main">
        <button
          type="button"
          className="icon-button sidebar-toggle"
          onClick={props.onToggleSidebar}
          aria-label={props.sidebarOpen ? ZH_TEXT.ariaCloseSidebar : ZH_TEXT.ariaOpenSidebar}
          title={props.sidebarOpen ? ZH_TEXT.ariaCloseSidebar : ZH_TEXT.ariaOpenSidebar}
        >
          <SidebarIcon />
        </button>
        <div>
          <h1>{ZH_TEXT.title}</h1>
          <p className="thread-id">{props.threadId ? `thread: ${props.threadId}` : ZH_TEXT.noThread}</p>
        </div>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={props.onToggleSettings}
          aria-label={props.settingsOpen ? ZH_TEXT.ariaCloseSettings : ZH_TEXT.ariaOpenSettings}
          title={props.settingsOpen ? ZH_TEXT.ariaCloseSettings : ZH_TEXT.ariaOpenSettings}
        >
          <GearIcon />
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
