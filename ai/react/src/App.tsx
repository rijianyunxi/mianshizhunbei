import './App.css'
import { ChatComposer } from './components/ChatComposer'
import { ChatHeader } from './components/ChatHeader'
import { ConversationSidebar } from './components/ConversationSidebar'
import { MessageList } from './components/MessageList'
import { SettingsPanel } from './components/SettingsPanel'
import { useChatApp } from './hooks/useChatApp'

function App() {
  const chat = useChatApp()

  return (
    <div className={`app-shell ${chat.settingsOpen ? 'settings-open' : ''}`}>
      <ConversationSidebar
        conversations={chat.conversations}
        activeThreadId={chat.threadId}
        loading={chat.conversationsLoading}
        sending={chat.sending}
        onCreate={chat.createConversation}
        onSelect={chat.selectConversation}
        onDelete={chat.deleteConversation}
      />

      <SettingsPanel
        threadId={chat.threadId}
        mcp={chat.mcp}
        onClose={chat.closeSettings}
        onClearConversation={chat.clearConversation}
      />

      <main className="chat-main">
        <ChatHeader
          threadId={chat.threadId}
          settingsOpen={chat.settingsOpen}
          theme={chat.theme}
          onToggleSettings={chat.toggleSettings}
          onToggleTheme={chat.toggleTheme}
        />
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

export default App
