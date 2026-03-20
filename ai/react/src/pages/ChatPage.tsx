import { useState } from 'react'
import { ZH_TEXT } from '../app/copy'
import { ChatComposer } from '../components/ChatComposer'
import { ChatHeader } from '../components/ChatHeader'
import { ConversationSidebar } from '../components/ConversationSidebar'
import { MessageList } from '../components/MessageList'
import { SettingsPanel } from '../components/SettingsPanel'
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
      <button
        type="button"
        className="sidebar-overlay"
        aria-label={ZH_TEXT.ariaCloseSidebar}
        onClick={() => setSidebarOpen(false)}
      />

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
        <ChatHeader
          threadId={chat.threadId}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          settingsOpen={chat.settingsOpen}
          onToggleSettings={chat.toggleSettings}
          theme={chat.theme}
          onToggleTheme={chat.toggleTheme}
        />
        <MessageList
          messages={chat.messages}
          streamingMessageId={chat.streamingMessageId}
          loading={chat.messagesLoading}
        />
        {chat.error ? <div className="status-error">{chat.error}</div> : null}
        <ChatComposer
          sending={chat.sending}
          onSend={chat.sendMessage}
          onStop={chat.stopStreaming}
        />
      </main>
    </div>
  )
}
