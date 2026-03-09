import { ZH_TEXT } from '../app/copy'
import type { ConversationSummary } from '../app/types'

type ConversationSidebarProps = {
  conversations: ConversationSummary[]
  activeThreadId: string
  loading: boolean
  sending: boolean
  onCreate: () => Promise<void>
  onSelect: (threadId: string) => Promise<void>
  onDelete: (threadId: string) => Promise<void>
}

function formatTimestamp(timestamp: number): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function ConversationSidebar(props: ConversationSidebarProps) {
  return (
    <aside className="conversation-sidebar">
      <button
        type="button"
        className="new-conversation-button"
        onClick={() => void props.onCreate()}
        disabled={props.sending}
      >
        {ZH_TEXT.newConversation}
      </button>

      <div className="conversation-sidebar-title">{ZH_TEXT.conversationHistory}</div>

      {props.loading ? <div className="conversation-sidebar-empty">{ZH_TEXT.loadingConversations}</div> : null}

      {!props.loading && props.conversations.length === 0 ? (
        <div className="conversation-sidebar-empty">{ZH_TEXT.noConversation}</div>
      ) : null}

      <div className="conversation-list">
        {props.conversations.map((item) => {
          const active = item.threadId === props.activeThreadId
          return (
            <div key={item.threadId} className={`conversation-item ${active ? 'active' : ''}`}>
              <button
                type="button"
                className="conversation-item-main"
                onClick={() => void props.onSelect(item.threadId)}
                disabled={props.sending}
              >
                <div className="conversation-item-title">{item.title || '\u65B0\u5BF9\u8BDD'}</div>
                <div className="conversation-item-preview">{item.lastMessage || item.threadId}</div>
                <div className="conversation-item-meta">{formatTimestamp(item.updatedAt)}</div>
              </button>
              <button
                type="button"
                className="conversation-delete-button"
                title={ZH_TEXT.deleteConversation}
                aria-label={ZH_TEXT.deleteConversation}
                onClick={() => void props.onDelete(item.threadId)}
                disabled={props.sending}
              >
                {ZH_TEXT.deletingConversation}
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
