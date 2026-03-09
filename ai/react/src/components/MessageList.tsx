import { useEffect, useMemo, useRef } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { ZH_TEXT } from '../app/copy'
import type { ChatMessage, ChatMessageToolTrace, ToolStatusItem } from '../app/types'
import { SpinnerIcon } from './icons'
import { MessageMarkdown } from './MessageMarkdown'

type MessageListProps = {
  messages: ChatMessage[]
  streamingMessageId: string | null
  loading?: boolean
}

function hasTrace(trace: ChatMessageToolTrace | undefined): boolean {
  if (!trace) {
    return false
  }

  return trace.runningTools.length > 0 || trace.selectedTools.length > 0 || trace.events.length > 0
}

function getToolStateLabel(item: ToolStatusItem): string {
  if (item.state === 'running') {
    return ZH_TEXT.toolBusy
  }
  if (item.state === 'error') {
    return ZH_TEXT.toolError
  }
  return ZH_TEXT.toolDone
}

function MessageToolTrace(props: { trace?: ChatMessageToolTrace }) {
  if (!hasTrace(props.trace)) {
    return null
  }

  const trace = props.trace as ChatMessageToolTrace

  return (
    <div className="message-tool-trace">
      {trace.runningTools.length > 0 ? (
        <div className="tool-block">
          <div className="tool-block-title">{ZH_TEXT.toolRunningTitle}</div>
          <div className="tool-chip-list">
            {trace.runningTools.map((item) => (
              <div key={item.id} className={`tool-chip tool-${item.state}`}>
                {item.state === 'running' ? <SpinnerIcon className="spinner-icon" /> : <span className="tool-dot" />}
                <span className="tool-name">{item.name.replace(/__+/g, '/')}</span>
                <span className="tool-state">{getToolStateLabel(item)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {trace.selectedTools.length > 0 ? (
        <div className="tool-block">
          <div className="tool-block-title">{ZH_TEXT.toolSelectedTitle}</div>
          <div className="tool-chip-list">
            {trace.selectedTools.map((tool) => (
              <div key={tool.key} className="tool-chip tool-selected">
                <span className="tool-dot" />
                <span className="tool-name">{tool.name}</span>
                <span className="tool-state">{tool.serverId}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {trace.events.length > 0 ? (
        <div className="tool-block">
          <div className="tool-block-title">{ZH_TEXT.toolRealtimeTitle}</div>
          <div className="tool-event-list">
            {trace.events.map((event) => (
              <div key={event.id} className={`tool-event-row tool-event-${event.phase}`}>
                <span className="tool-event-phase">
                  {event.phase === 'start' ? ZH_TEXT.toolEventStart : ZH_TEXT.toolEventEnd}
                </span>
                <span className="tool-event-name">{event.name}</span>
                {event.detail ? <span className="tool-event-detail">{event.detail}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
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

  if (props.loading) {
    return (
      <section className="chat-scroll">
        <div className="empty-state">
          <h3>{ZH_TEXT.loadingMessages}</h3>
        </div>
      </section>
    )
  }

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
                <div className="message-bubble">
                  <MessageToolTrace trace={item.toolTrace} />
                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )
          }

          return (
            <article className={`message-row ${item.role}`}>
              <div className="message-avatar">{item.role === 'assistant' ? 'AI' : '\u6211'}</div>
              <div className="message-bubble">
                {item.role === 'assistant' ? <MessageToolTrace trace={item.toolTrace} /> : null}
                <MessageMarkdown content={item.content} streaming={isStreaming} />
              </div>
            </article>
          )
        }}
      />
    </section>
  )
}
