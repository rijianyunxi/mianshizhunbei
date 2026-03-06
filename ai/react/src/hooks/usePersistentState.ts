import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

type PersistentStateOptions<T> = {
  deserialize?: (raw: string) => T
  serialize?: (value: T) => string
}

export function usePersistentState<T>(
  storageKey: string,
  initialValue: T | (() => T),
  options: PersistentStateOptions<T> = {},
): [T, Dispatch<SetStateAction<T>>] {
  const deserialize = options.deserialize ?? ((raw: string) => JSON.parse(raw) as T)
  const serialize = options.serialize ?? ((value: T) => JSON.stringify(value))

  const [state, setState] = useState<T>(() => {
    const fallbackValue = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        return fallbackValue
      }
      return deserialize(raw)
    } catch {
      return fallbackValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, serialize(state))
    } catch {
      // Ignore storage errors and keep runtime state available.
    }
  }, [state, storageKey])

  return [state, setState]
}
