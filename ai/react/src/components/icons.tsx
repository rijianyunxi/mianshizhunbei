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
