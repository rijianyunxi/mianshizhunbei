import { ZH_TEXT } from '../app/copy'
import type { SelectedToolItem, ToolEventLogItem, ToolStatusItem } from '../app/types'
import { SpinnerIcon } from './icons'

type ToolActivityBarProps = {
  items: ToolStatusItem[]
  selectedTools: SelectedToolItem[]
  events: ToolEventLogItem[]
}

function getLabel(item: ToolStatusItem): string {
  if (item.state === 'running') {
    return ZH_TEXT.toolBusy
  }
  if (item.state === 'error') {
    return ZH_TEXT.toolError
  }
  return ZH_TEXT.toolDone
}

export function ToolActivityBar(props: ToolActivityBarProps) {
  if (props.items.length === 0 && props.selectedTools.length === 0 && props.events.length === 0) {
    return null
  }

  return (
    <section className="tool-activity" aria-live="polite">
      {props.items.length > 0 ? (
        <div className="tool-block">
          <div className="tool-block-title">{ZH_TEXT.toolRunningTitle}</div>
          <div className="tool-chip-list">
            {props.items.map((item) => (
              <div key={item.id} className={`tool-chip tool-${item.state}`}>
                {item.state === 'running' ? <SpinnerIcon className="spinner-icon" /> : <span className="tool-dot" />}
                <span className="tool-name">{item.name.replace(/__+/g, '/')}</span>
                <span className="tool-state">{getLabel(item)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {props.selectedTools.length > 0 ? (
        <div className="tool-block">
          <div className="tool-block-title">{ZH_TEXT.toolSelectedTitle}</div>
          <div className="tool-chip-list">
            {props.selectedTools.map((tool) => (
              <div key={tool.key} className="tool-chip tool-selected">
                <span className="tool-dot" />
                <span className="tool-name">{tool.name}</span>
                <span className="tool-state">{tool.serverId}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {props.events.length > 0 ? (
        <div className="tool-block">
          <div className="tool-block-title">{ZH_TEXT.toolRealtimeTitle}</div>
          <div className="tool-event-list">
            {props.events.map((event) => (
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
    </section>
  )
}
