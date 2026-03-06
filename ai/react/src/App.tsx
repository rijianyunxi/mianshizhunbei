import './App.css'
import { ChatComposer } from './components/ChatComposer'
import { ChatHeader } from './components/ChatHeader'
import { MessageList } from './components/MessageList'
import { SettingsPanel } from './components/SettingsPanel'
import { useChatApp } from './hooks/useChatApp'

function App() {
  const chat = useChatApp()

  return (
    <div className={`app-shell ${chat.settingsOpen ? 'settings-open' : ''}`}>
      <SettingsPanel
        settings={chat.settings}
        modelSelectValue={chat.modelSelectValue}
        customModelMode={chat.customModelMode}
        onClose={chat.closeSettings}
        onModelSelect={chat.selectModel}
        onUpdateSettings={chat.updateSettings}
        onClearConversation={chat.clearConversation}
      />

      <main className="chat-main">
        <ChatHeader
          modelName={chat.settings.model}
          settingsOpen={chat.settingsOpen}
          theme={chat.theme}
          onToggleSettings={chat.toggleSettings}
          onToggleTheme={chat.toggleTheme}
        />
        <MessageList messages={chat.messages} streamingMessageId={chat.streamingMessageId} />
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
