import type { ComponentNode, MaterialComponentName, PageSchema } from './types'
import { ROOT_NODE_ID, SCHEMA_VERSION } from './types'

interface MaterialDefaults {
  props: Record<string, unknown>
  style: Record<string, string>
  canHaveChildren: boolean
}

const MATERIAL_DEFAULTS: Record<MaterialComponentName, MaterialDefaults> = {
  Container: {
    props: {
      title: '容器'
    },
    style: {
      margin: '8px',
      padding: '12px',
      color: '#1f2933'
    },
    canHaveChildren: true
  },
  Layout: {
    props: {
      direction: 'row',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: '12px'
    },
    style: {
      margin: '8px 0',
      padding: '12px',
      color: '#1f2933'
    },
    canHaveChildren: true
  },
  Button: {
    props: {
      text: '提交',
      type: 'primary',
      onClickMessage: '按钮点击成功'
    },
    style: {
      margin: '8px 0',
      padding: '8px 14px',
      color: '#ffffff'
    },
    canHaveChildren: false
  },
  Input: {
    props: {
      placeholder: '请输入内容',
      value: ''
    },
    style: {
      margin: '8px 0',
      padding: '6px 10px',
      color: '#111827'
    },
    canHaveChildren: false
  },
  Text: {
    props: {
      text: '这是一段文本'
    },
    style: {
      margin: '8px 0',
      padding: '0',
      color: '#374151'
    },
    canHaveChildren: false
  }
}

export interface NodeLocation {
  node: ComponentNode
  parent: ComponentNode | null
  index: number
}

export function createDefaultSchema(): PageSchema {
  return {
    version: SCHEMA_VERSION,
    componentsTree: {
      id: ROOT_NODE_ID,
      componentName: 'Container',
      props: {
        title: '页面根容器'
      },
      style: {
        margin: '0',
        padding: '16px',
        color: '#0f172a'
      },
      children: []
    }
  }
}

export function cloneSchema(schema: PageSchema): PageSchema {
  return JSON.parse(JSON.stringify(schema)) as PageSchema
}

export function createComponentNode(componentName: MaterialComponentName): ComponentNode {
  const defaults = MATERIAL_DEFAULTS[componentName]
  return {
    id: createNodeId(),
    componentName,
    props: { ...defaults.props },
    style: { ...defaults.style },
    children: defaults.canHaveChildren ? [] : undefined
  }
}

function createNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `node_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
}

export function ensureChildren(node: ComponentNode): ComponentNode[] {
  if (!node.children) {
    node.children = []
  }
  return node.children
}

export function findNode(root: ComponentNode, id: string): ComponentNode | null {
  if (root.id === id) {
    return root
  }
  const children = root.children ?? []
  for (const child of children) {
    const nested = findNode(child, id)
    if (nested) {
      return nested
    }
  }
  return null
}

export function findNodeLocation(root: ComponentNode, id: string): NodeLocation | null {
  return walkNode(root, null, -1, id)
}

function walkNode(
  node: ComponentNode,
  parent: ComponentNode | null,
  index: number,
  targetId: string
): NodeLocation | null {
  if (node.id === targetId) {
    return { node, parent, index }
  }
  const children = node.children ?? []
  for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
    const child = children[childIndex]
    if (!child) {
      continue
    }
    const found = walkNode(child, node, childIndex, targetId)
    if (found) {
      return found
    }
  }
  return null
}

export function isContainerNode(node: ComponentNode): boolean {
  return node.componentName === 'Container' || node.componentName === 'Layout'
}

export function addMaterialToParent(
  root: ComponentNode,
  parentId: string,
  componentName: MaterialComponentName,
  index?: number
): ComponentNode | null {
  const parent = findNode(root, parentId)
  if (!parent || !isContainerNode(parent)) {
    return null
  }
  const child = createComponentNode(componentName)
  const children = ensureChildren(parent)
  const safeIndex = normalizeIndex(children.length, index)
  children.splice(safeIndex, 0, child)
  return child
}

export function deleteNode(root: ComponentNode, nodeId: string): boolean {
  if (nodeId === ROOT_NODE_ID) {
    return false
  }
  const location = findNodeLocation(root, nodeId)
  if (!location || !location.parent) {
    return false
  }
  const siblings = location.parent.children ?? []
  siblings.splice(location.index, 1)
  return true
}

export function moveNode(
  root: ComponentNode,
  nodeId: string,
  targetParentId: string,
  targetIndex: number
): boolean {
  if (nodeId === ROOT_NODE_ID) {
    return false
  }
  const source = findNodeLocation(root, nodeId)
  const targetParent = findNode(root, targetParentId)
  if (!source || !source.parent || !targetParent || !isContainerNode(targetParent)) {
    return false
  }
  if (containsNode(source.node, targetParentId)) {
    return false
  }

  const sourceSiblings = source.parent.children ?? []
  const [movingNode] = sourceSiblings.splice(source.index, 1)
  if (!movingNode) {
    return false
  }

  const targetChildren = ensureChildren(targetParent)
  let safeIndex = normalizeIndex(targetChildren.length, targetIndex)
  if (source.parent.id === targetParent.id && source.index < safeIndex) {
    safeIndex -= 1
  }
  targetChildren.splice(safeIndex, 0, movingNode)
  return true
}

function normalizeIndex(length: number, index?: number): number {
  if (typeof index !== 'number' || Number.isNaN(index)) {
    return length
  }
  if (index < 0) {
    return 0
  }
  if (index > length) {
    return length
  }
  return index
}

function containsNode(root: ComponentNode, targetId: string): boolean {
  if (root.id === targetId) {
    return true
  }
  const children = root.children ?? []
  return children.some((child) => containsNode(child, targetId))
}

export function getMaterialDefaults(componentName: MaterialComponentName): MaterialDefaults {
  return MATERIAL_DEFAULTS[componentName]
}
