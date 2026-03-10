import { useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import { ChatComposer } from '../components/ChatComposer'
import { ChatHeader } from '../components/ChatHeader'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { MessageList } from '../components/MessageList'
import { SettingsPanel } from '../components/SettingsPanel'
import { GearIcon, SidebarIcon, ThemeIcon } from '../components/icons'
import { useChatApp } from '../hooks/useChatApp'

export default function ChatPage() {
  const chat = useChatApp()
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true,
  )

  const handleCreate = async () => {
    await chat.createConversation()
    setSidebarOpen(false)
  }

  const handleSelect = async (nextThreadId: string) => {
    await chat.selectConversation(nextThreadId)
    setSidebarOpen(false)
  }

  const handleDelete = async (nextThreadId: string) => {
    await chat.deleteConversation(nextThreadId)
  }

  return (
    <div
      className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}
    >
      <aside className="left-rail">
        <div className="rail-group">
          <button
            type="button"
            className="rail-button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? ZH_TEXT.ariaCloseSidebar : ZH_TEXT.ariaOpenSidebar}
            title={sidebarOpen ? ZH_TEXT.ariaCloseSidebar : ZH_TEXT.ariaOpenSidebar}
          >
            <SidebarIcon />
          </button>
        </div>
        <div className="rail-group rail-group-bottom">
          <button
            type="button"
            className="rail-button"
            onClick={chat.toggleSettings}
            aria-label={chat.settingsOpen ? ZH_TEXT.ariaCloseSettings : ZH_TEXT.ariaOpenSettings}
            title={chat.settingsOpen ? ZH_TEXT.ariaCloseSettings : ZH_TEXT.ariaOpenSettings}
          >
            <GearIcon />
          </button>
          <button
            type="button"
            className="rail-button"
            onClick={chat.toggleTheme}
            aria-label={chat.theme === 'dark' ? ZH_TEXT.ariaSwitchToLight : ZH_TEXT.ariaSwitchToDark}
            title={chat.theme === 'dark' ? ZH_TEXT.ariaSwitchToLight : ZH_TEXT.ariaSwitchToDark}
          >
            <ThemeIcon theme={chat.theme} />
          </button>
        </div>
      </aside>

      <ConversationSidebar
        conversations={chat.conversations}
        activeThreadId={chat.threadId}
        loading={chat.conversationsLoading}
        sending={chat.sending}
        onCreate={handleCreate}
        onSelect={handleSelect}
        onDelete={handleDelete}
      />

      {chat.settingsOpen ? (
        <SettingsPanel
          mcp={chat.mcp}
          onClose={chat.closeSettings}
        />
      ) : null}

      <main className="chat-main">
        <ChatHeader threadId={chat.threadId} />
        <MessageList
          messages={chat.messages}
          streamingMessageId={chat.streamingMessageId}
          loading={chat.messagesLoading}
        />
        {chat.error ? <div className="status-error">{chat.error}</div> : null}
        <ChatComposer
          value={chat.draft}
          sending={chat.sending}
          onChange={chat.setDraft}
          onSend={chat.sendMessage}
        />
      </main>
    </div>
  )
}
