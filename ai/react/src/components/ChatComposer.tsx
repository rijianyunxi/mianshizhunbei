import type { FormEvent, KeyboardEvent } from 'react'
import { ZH_TEXT } from '../app/copy'
import { PlusIcon, SlidersIcon, StopIcon } from './icons'

type ChatComposerProps = {
  value: string
  sending: boolean
  onChange: (value: string) => void
  onSend: () => Promise<void>
  onStop: () => void
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
      <div className="composer-shell">
        <textarea
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          onKeyDown={onComposerKeyDown}
          rows={2}
          placeholder={ZH_TEXT.composerPlaceholder}
          disabled={props.sending}
        />
        <div className="composer-actions">
          <div className="composer-left">
            <button type="button" className="composer-icon-button" aria-label="Add" disabled>
              <PlusIcon />
            </button>
            <button type="button" className="composer-tool-button" aria-label="Tools" disabled>
              <SlidersIcon />
              <span>工具</span>
            </button>
          </div>
          <div className="composer-right">
            {props.sending ? (
              <button type="button" className="composer-stop" onClick={props.onStop} aria-label="停止">
                <StopIcon />
                <span>停止</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  )
}
