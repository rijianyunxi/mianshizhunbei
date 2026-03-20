export type MaterialComponentName = 'Container' | 'Layout' | 'Button' | 'Input' | 'Text'

export interface ComponentNode {
  id: string
  componentName: MaterialComponentName
  props: Record<string, unknown>
  style?: Record<string, string>
  children?: ComponentNode[]
}

export interface PageSchema {
  version: string
  componentsTree: ComponentNode
}

export interface MaterialDefinition {
  componentName: MaterialComponentName
  label: string
  description: string
}

export type DragPayload =
  | { type: 'material'; componentName: MaterialComponentName }
  | { type: 'node'; nodeId: string }

export const ROOT_NODE_ID = 'root'
export const SCHEMA_VERSION = '1.0.0'
export const SCHEMA_STORAGE_KEY = 'lowcode_mvp_schema'
