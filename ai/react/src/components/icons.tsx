import type { Theme } from '../app/types'

type BooleanIconProps = {
  open: boolean
}

export function SettingsIcon(props: BooleanIconProps) {
  if (props.open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 5a2 2 0 0 1 2-2h2v18H5a2 2 0 0 1-2-2V5Zm6-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9V3Zm6.59 5.41L17 9.83 14.83 12 17 14.17l-1.41 1.42L12 12.99l-3.59 3.6L7 15.17 10.59 12 7 8.83l1.41-1.42L12 11.01l3.59-3.6Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10V3H5Zm12 0h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2V3ZM8.41 8.41 10.59 10.6 12.77 8.4l1.41 1.42-2.18 2.18 2.18 2.18-1.41 1.42-2.18-2.19-2.18 2.19-1.41-1.42 2.18-2.18-2.18-2.18 1.41-1.42Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm8.2 3.4a6.45 6.45 0 0 0-.1-1.2l2-1.55a1 1 0 0 0 .24-1.32l-1.9-3.28a1 1 0 0 0-1.26-.45l-2.35.95a7.7 7.7 0 0 0-2.08-1.2l-.35-2.5a1 1 0 0 0-.98-.86H9.58a1 1 0 0 0-.98.86l-.35 2.5c-.73.3-1.42.7-2.07 1.2l-2.35-.95a1 1 0 0 0-1.26.45L.67 7.93a1 1 0 0 0 .24 1.32l2 1.55a7.9 7.9 0 0 0 0 2.4l-2 1.55a1 1 0 0 0-.24 1.32l1.9 3.28a1 1 0 0 0 1.26.45l2.35-.95c.65.5 1.34.9 2.07 1.2l.35 2.5a1 1 0 0 0 .98.86h4.84a1 1 0 0 0 .98-.86l.35-2.5a7.7 7.7 0 0 0 2.08-1.2l2.35.95a1 1 0 0 0 1.26-.45l1.9-3.28a1 1 0 0 0-.24-1.32l-2-1.55c.07-.4.1-.8.1-1.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 5a2 2 0 0 1 4 0v1h9a1 1 0 1 1 0 2h-9v1a2 2 0 0 1-4 0V8H4a1 1 0 1 1 0-2h3V5Zm6 10a2 2 0 0 1 4 0v1h3a1 1 0 1 1 0 2h-3v1a2 2 0 0 1-4 0v-1H4a1 1 0 1 1 0-2h9v-1Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function PlugIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 2a1 1 0 0 1 1 1v4h6V3a1 1 0 1 1 2 0v4h2a1 1 0 1 1 0 2h-2v2.2a6 6 0 0 1-5 5.92V21a1 1 0 1 1-2 0v-3.88a6 6 0 0 1-5-5.92V9H3a1 1 0 1 1 0-2h2V3a1 1 0 0 1 1-1Zm1 7v2.2a4 4 0 0 0 8 0V9H9Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function TerminalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2 0v16h12V4H6Zm2.3 4.3a1 1 0 0 1 1.4 0l3.3 3.3a1 1 0 0 1 0 1.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L10.59 12 8.3 9.7a1 1 0 0 1 0-1.4ZM12 16a1 1 0 1 1 0-2h4a1 1 0 1 1 0 2h-4Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h1v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm1 2V5h4v0H10Zm-1 4a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
    </svg>
  )
}

type ThemeIconProps = {
  theme: Theme
}

export function ThemeIcon(props: ThemeIconProps) {
  if (props.theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 4.75a1 1 0 0 1 1 1V7.5a1 1 0 1 1-2 0V5.75a1 1 0 0 1 1-1Zm0 11a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm7.25-3.75a1 1 0 0 1-1-1V9.25a1 1 0 1 1 2 0V11a1 1 0 0 1-1 1ZM12 18.5a1 1 0 0 1 1 1v1.75a1 1 0 1 1-2 0V19.5a1 1 0 0 1 1-1ZM4.75 12a1 1 0 0 1-1-1V9.25a1 1 0 1 1 2 0V11a1 1 0 0 1-1 1Zm13.28 5.7a1 1 0 0 1 1.42-1.42l1.24 1.24a1 1 0 0 1-1.42 1.42l-1.24-1.24ZM4.3 4.3a1 1 0 0 1 1.4 0l1.25 1.24A1 1 0 0 1 5.53 6.96L4.3 5.71a1 1 0 0 1 0-1.4Zm15.95.01a1 1 0 0 1 0 1.4l-1.24 1.25a1 1 0 0 1-1.42-1.42l1.24-1.24a1 1 0 0 1 1.42 0ZM5.54 17.05a1 1 0 0 1 1.42 1.42L5.7 19.7a1 1 0 1 1-1.4-1.42l1.24-1.24Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.7 3.65a1 1 0 0 1 .75 1.44 7.7 7.7 0 0 0 3.5 10.11 1 1 0 0 1 .1 1.73A9.5 9.5 0 1 1 7.06 4.95a1 1 0 0 1 1.73.1 7.7 7.7 0 0 0 5.91 3.53 1 1 0 0 1 .9 1.12 7.82 7.82 0 0 0 .01 2.3 1 1 0 0 1-1.56.94A9.74 9.74 0 0 1 9 6.83 7.5 7.5 0 1 0 17.2 15a9.77 9.77 0 0 1-4.37-5.74 1 1 0 0 1 1.17-1.2 7.7 7.7 0 0 0 1.4.17 1 1 0 0 1 .9 1.22 7.65 7.65 0 0 0-.06 3.53 1 1 0 0 1-1.63.98 9.7 9.7 0 0 1-2.8-3.9 1 1 0 0 1 1.01-1.33 7.8 7.8 0 0 0 1.95-.28 1 1 0 0 1 .94.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M17.3 5.3a1 1 0 0 1 1.4 1.4L13.42 12l5.3 5.3a1 1 0 0 1-1.42 1.4L12 13.42l-5.3 5.3a1 1 0 0 1-1.4-1.42L10.58 12 5.3 6.7a1 1 0 1 1 1.4-1.4L12 10.58l5.3-5.3Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.33 3.66a1 1 0 0 0-1.02-.24L3.96 8.53a1 1 0 0 0-.04 1.88l6.25 2.42 2.42 6.25a1 1 0 0 0 1.88-.04l5.1-15.35a1 1 0 0 0-.24-1.03Zm-6.12 12.1-1.52-3.93a1 1 0 0 0-.58-.58l-3.93-1.52 8.5-2.83-2.47 8.86Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm4 0v16h10V4H8Zm-2 0v16h1V4H6Zm5 4h5a1 1 0 1 1 0 2h-5a1 1 0 0 1 0-2Zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 0 1 0-2Zm0 4h5a1 1 0 1 1 0 2h-5a1 1 0 0 1 0-2Z"
        fill="currentColor"
      />
    </svg>
  )
}

type SpinnerIconProps = {
  className?: string
}

export function SpinnerIcon(props: SpinnerIconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={props.className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
