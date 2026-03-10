import { ZH_TEXT } from '../app/copy'

type ChatHeaderProps = {
  threadId: string
}

export function ChatHeader(props: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <h1>{ZH_TEXT.title}</h1>
        <p>{ZH_TEXT.backendManagedHint}</p>
        <p className="thread-id">{props.threadId ? `thread: ${props.threadId}` : ZH_TEXT.noThread}</p>
      </div>
    </header>
  )
}
