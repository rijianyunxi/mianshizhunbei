import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { ZH_TEXT } from '../app/copy'
import { PlusIcon, SlidersIcon, StopIcon } from './icons'

type ChatComposerProps = {
  sending: boolean
  onSend: (content: string) => Promise<void>
  onStop: () => void
}

export function ChatComposer(props: ChatComposerProps) {
  const [value, setValue] = useState('')

  const submitCurrent = async () => {
    const next = value.trim()
    if (!next || props.sending) {
      return
    }

    setValue('')
    try {
      await props.onSend(next)
    } catch {
      setValue((current) => (current ? current : next))
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitCurrent()
  }

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitCurrent()
    }
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <div className="composer-shell">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
