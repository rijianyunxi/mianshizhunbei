import { useEffect, useMemo, useRef } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { ZH_TEXT } from '../app/copy'
import type { ChatMessage } from '../app/types'
import { MessageMarkdown } from './MessageMarkdown'

type MessageListProps = {
  messages: ChatMessage[]
  streamingMessageId: string | null
}

export function MessageList(props: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null)

  const rows = useMemo<ChatMessage[]>(() => props.messages, [props.messages])

  useEffect(() => {
    if (!props.streamingMessageId || rows.length === 0) {
      return
    }

    virtuosoRef.current?.scrollToIndex({
      index: rows.length - 1,
      align: 'end',
      behavior: 'auto',
    })
  }, [rows, props.streamingMessageId])

  if (rows.length === 0) {
    return (
      <section className="chat-scroll">
        <div className="empty-state">
          <h3>{ZH_TEXT.emptyTitle}</h3>
          <p>{ZH_TEXT.emptyDescription}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="chat-scroll">
      <Virtuoso
        ref={virtuosoRef}
        className="chat-virtual-list"
        style={{ height: '100%' }}
        data={rows}
        computeItemKey={(_, item) => item.id}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        alignToBottom
        increaseViewportBy={320}
        itemContent={(_, item) => {
          const isStreaming = props.streamingMessageId === item.id
          if (isStreaming && !item.content.trim()) {
            return (
              <article className="message-row assistant">
                <div className="message-avatar">AI</div>
                <div className="message-bubble typing">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            )
          }

          return (
            <article className={`message-row ${item.role}`}>
              <div className="message-avatar">{item.role === 'assistant' ? 'AI' : '我'}</div>
              <div className="message-bubble">
                <MessageMarkdown content={item.content} streaming={isStreaming} />
              </div>
            </article>
          )
        }}
      />
    </section>
  )
}
