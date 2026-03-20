import type { ComponentNode, MaterialComponentName, PageSchema } from './types'
import { SCHEMA_STORAGE_KEY } from './types'
import { cloneSchema, createDefaultSchema } from './tree'

const MATERIAL_NAMES: MaterialComponentName[] = ['Container', 'Layout', 'Button', 'Input', 'Text']

export function loadSchemaFromStorage(): PageSchema {
  const fallback = createDefaultSchema()
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(SCHEMA_STORAGE_KEY)
  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    const validated = validatePageSchema(parsed)
    if (!validated) {
      return fallback
    }
    return validated
  } catch {
    return fallback
  }
}

export function saveSchemaToStorage(schema: PageSchema): void {
  if (typeof window === 'undefined') {
    return
  }
  const safeSchema = cloneSchema(schema)
  window.localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(safeSchema, null, 2))
}

function validatePageSchema(input: unknown): PageSchema | null {
  if (!isRecord(input)) {
    return null
  }
  if (typeof input.version !== 'string') {
    return null
  }
  const root = validateNode(input.componentsTree)
  if (!root) {
    return null
  }
  return {
    version: input.version,
    componentsTree: root
  }
}

function validateNode(input: unknown): ComponentNode | null {
  if (!isRecord(input)) {
    return null
  }
  if (typeof input.id !== 'string') {
    return null
  }
  if (!isMaterialName(input.componentName)) {
    return null
  }
  if (!isRecord(input.props)) {
    return null
  }

  let style: Record<string, string> | undefined
  if (input.style !== undefined) {
    if (!isRecord(input.style)) {
      return null
    }
    style = {}
    for (const key of Object.keys(input.style)) {
      const value = input.style[key]
      if (typeof value !== 'string') {
        return null
      }
      style[key] = value
    }
  }

  let children: ComponentNode[] | undefined
  if (input.children !== undefined) {
    if (!Array.isArray(input.children)) {
      return null
    }
    children = []
    for (const child of input.children) {
      const validatedChild = validateNode(child)
      if (!validatedChild) {
        return null
      }
      children.push(validatedChild)
    }
  }

  return {
    id: input.id,
    componentName: input.componentName,
    props: { ...input.props },
    style,
    children
  }
}

function isMaterialName(value: unknown): value is MaterialComponentName {
  return typeof value === 'string' && MATERIAL_NAMES.includes(value as MaterialComponentName)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
