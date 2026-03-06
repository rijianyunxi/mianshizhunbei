import { ZH_TEXT } from '../app/copy'
import { CUSTOM_MODEL_VALUE, PRESET_MODELS } from '../app/config'
import type { ChatSettings } from '../app/types'
import { CloseIcon } from './icons'

type SettingsPanelProps = {
  settings: ChatSettings
  modelSelectValue: string
  customModelMode: boolean
  onClose: () => void
  onModelSelect: (value: string) => void
  onUpdateSettings: (patch: Partial<ChatSettings>) => void
  onClearConversation: () => void
}

export function SettingsPanel(props: SettingsPanelProps) {
  return (
    <aside className="settings-panel">
      <div className="panel-header">
        <h2>{ZH_TEXT.settingsTitle}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={props.onClose}
          aria-label={ZH_TEXT.ariaCloseSettings}
          title={ZH_TEXT.ariaCloseSettings}
        >
          <CloseIcon />
        </button>
      </div>

      <label className="field">
        <span>{ZH_TEXT.apiUrl}</span>
        <input
          type="url"
          value={props.settings.apiUrl}
          onChange={(event) => props.onUpdateSettings({ apiUrl: event.target.value })}
          placeholder={ZH_TEXT.apiUrlPlaceholder}
        />
      </label>

      <label className="field">
        <span>{ZH_TEXT.apiKey}</span>
        <input
          type="password"
          value={props.settings.apiKey}
          onChange={(event) => props.onUpdateSettings({ apiKey: event.target.value })}
          placeholder={ZH_TEXT.apiKeyPlaceholder}
        />
      </label>

      <label className="field">
        <span>{ZH_TEXT.model}</span>
        <select value={props.modelSelectValue} onChange={(event) => props.onModelSelect(event.target.value)}>
          {PRESET_MODELS.map((modelName) => (
            <option key={modelName} value={modelName}>
              {modelName}
            </option>
          ))}
          <option value={CUSTOM_MODEL_VALUE}>{ZH_TEXT.customModelOption}</option>
        </select>
      </label>

      {props.customModelMode ? (
        <label className="field">
          <span>{ZH_TEXT.customModelName}</span>
          <input
            type="text"
            value={props.settings.model}
            onChange={(event) => props.onUpdateSettings({ model: event.target.value })}
            placeholder={ZH_TEXT.customModelPlaceholder}
          />
        </label>
      ) : null}

      <label className="field">
        <span>{ZH_TEXT.systemPrompt}</span>
        <textarea
          value={props.settings.systemPrompt}
          onChange={(event) => props.onUpdateSettings({ systemPrompt: event.target.value })}
          rows={4}
        />
      </label>

      <button type="button" className="clear-chat-button" onClick={props.onClearConversation}>
        {ZH_TEXT.clearConversation}
      </button>
    </aside>
  )
}
