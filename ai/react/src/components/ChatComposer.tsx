import type { FormEvent, KeyboardEvent } from 'react'
import { ZH_TEXT } from '../app/copy'
import { SendIcon, SpinnerIcon } from './icons'

type ChatComposerProps = {
  value: string
  sending: boolean
  onChange: (value: string) => void
  onSend: () => Promise<void>
}

export function ChatComposer(props: ChatComposerProps) {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void props.onSend()
  }

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void props.onSend()
    }
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <textarea
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={onComposerKeyDown}
        rows={3}
        placeholder={ZH_TEXT.composerPlaceholder}
        disabled={props.sending}
      />
      <button type="submit" className="send-button" disabled={props.sending || !props.value.trim()}>
        {props.sending ? <SpinnerIcon className="spinner-icon" /> : <SendIcon />}
        <span>{props.sending ? ZH_TEXT.sending : ZH_TEXT.send}</span>
      </button>
    </form>
  )
}
