<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentNode, DragPayload, MaterialComponentName } from '../../schema/types'
import { ROOT_NODE_ID } from '../../schema/types'

defineOptions({ name: 'RenderNode' })

type RenderMode = 'preview' | 'designer'

const props = withDefaults(
  defineProps<{
    node: ComponentNode
    model: Record<string, string>
    mode?: RenderMode
    selectedId?: string
  }>(),
  {
    mode: 'preview',
    selectedId: ''
  }
)

const emit = defineEmits<{
  (event: 'button-click', payload: { id: string; message: string }): void
  (event: 'select', id: string): void
  (event: 'drop-into', payload: { parentId: string; dragPayload: DragPayload }): void
  (event: 'drop-after', payload: { targetId: string; dragPayload: DragPayload }): void
  (event: 'drag-node-start', nodeId: string): void
  (event: 'drag-node-end'): void
}>()

const MATERIAL_NAMES: MaterialComponentName[] = ['Container', 'Layout', 'Button', 'Input', 'Text']

const componentMap: Record<ComponentNode['componentName'], string> = {
  Container: 'div',
  Layout: 'div',
  Button: 'button',
  Input: 'input',
  Text: 'span'
}

const resolvedTag = computed(() => componentMap[props.node.componentName])
const isContainer = computed(() => props.node.componentName === 'Container')
const isLayout = computed(() => props.node.componentName === 'Layout')
const isButton = computed(() => props.node.componentName === 'Button')
const isInput = computed(() => props.node.componentName === 'Input')
const isText = computed(() => props.node.componentName === 'Text')
const canRenderChildren = computed(() => isContainer.value || isLayout.value)
const isDesignerMode = computed(() => props.mode === 'designer')
const isRoot = computed(() => props.node.id === ROOT_NODE_ID)
const isSelected = computed(() => isDesignerMode.value && props.selectedId === props.node.id)

const buttonText = computed(() => {
  return typeof props.node.props.text === 'string' ? props.node.props.text : 'Button'
})

const textContent = computed(() => {
  return typeof props.node.props.text === 'string' ? props.node.props.text : ''
})

const inputPlaceholder = computed(() => {
  return typeof props.node.props.placeholder === 'string' ? props.node.props.placeholder : ''
})

const inputValue = computed(() => {
  const runtimeValue = props.model[props.node.id]
  if (typeof runtimeValue === 'string') {
    return runtimeValue
  }
  return typeof props.node.props.value === 'string' ? props.node.props.value : ''
})

const runtimeClass = computed(() => {
  if (isContainer.value) {
    return 'runtime-container'
  }
  if (isLayout.value) {
    return 'runtime-layout'
  }
  if (isButton.value) {
    const type = typeof props.node.props.type === 'string' ? props.node.props.type : 'default'
    return type === 'primary' ? 'runtime-button runtime-button-primary' : 'runtime-button runtime-button-default'
  }
  if (isInput.value) {
    return 'runtime-input'
  }
  return 'runtime-text'
})

const mergedStyle = computed<Record<string, string>>(() => {
  const base = { ...(props.node.style ?? {}) }
  if (isContainer.value) {
    base.minHeight = base.minHeight ?? '36px'
  }
  if (isLayout.value) {
    const direction = typeof props.node.props.direction === 'string' ? props.node.props.direction : 'row'
    const justifyContent =
      typeof props.node.props.justifyContent === 'string' ? props.node.props.justifyContent : 'flex-start'
    const alignItems = typeof props.node.props.alignItems === 'string' ? props.node.props.alignItems : 'stretch'
    const gap = typeof props.node.props.gap === 'string' ? props.node.props.gap : '12px'

    base.display = base.display ?? 'flex'
    base.flexDirection = base.flexDirection ?? direction
    base.justifyContent = base.justifyContent ?? justifyContent
    base.alignItems = base.alignItems ?? alignItems
    base.gap = base.gap ?? gap
    base.minHeight = base.minHeight ?? '42px'
    base.borderRadius = base.borderRadius ?? '10px'
    base.background = base.background ?? '#f8fafc'
  }
  if (isButton.value) {
    base.border = base.border ?? 'none'
    base.cursor = base.cursor ?? 'pointer'
    base.borderRadius = base.borderRadius ?? '8px'
  }
  if (isInput.value) {
    base.border = base.border ?? '1px solid #94a3b8'
    base.borderRadius = base.borderRadius ?? '8px'
    base.width = base.width ?? '100%'
    base.boxSizing = base.boxSizing ?? 'border-box'
  }
  return base
})

const componentAttrs = computed<Record<string, unknown>>(() => {
  if (isInput.value) {
    return {
      value: inputValue.value,
      placeholder: inputPlaceholder.value,
      readonly: isDesignerMode.value
    }
  }
  if (isButton.value) {
    return {
      type: 'button'
    }
  }
  return {}
})

function handleClick(event: MouseEvent): void {
  if (isDesignerMode.value) {
    event.stopPropagation()
    emit('select', props.node.id)
    return
  }

  if (!isButton.value) {
    return
  }
  const message = typeof props.node.props.onClickMessage === 'string' ? props.node.props.onClickMessage : ''
  if (!message) {
    return
  }
  emit('button-click', {
    id: props.node.id,
    message
  })
}

function handleInput(event: Event): void {
  if (!isInput.value || isDesignerMode.value) {
    return
  }
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }
  props.model[props.node.id] = target.value
}

function onDragStart(event: DragEvent): void {
  if (!isDesignerMode.value || isRoot.value) {
    return
  }
  const transfer = event.dataTransfer
  if (!transfer) {
    return
  }
  transfer.effectAllowed = 'move'
  transfer.setData('application/x-node-id', props.node.id)
  emit('drag-node-start', props.node.id)
}

function onDragEnd(): void {
  if (!isDesignerMode.value) {
    return
  }
  emit('drag-node-end')
}

function onDragOver(event: DragEvent): void {
  if (!isDesignerMode.value) {
    return
  }
  event.preventDefault()
}

function onDrop(event: DragEvent): void {
  if (!isDesignerMode.value) {
    return
  }
  const dragPayload = parseDragPayload(event)
  if (!dragPayload) {
    return
  }

  if (shouldInsertAfter(event)) {
    emit('drop-after', {
      targetId: props.node.id,
      dragPayload
    })
    return
  }

  if (canRenderChildren.value || isRoot.value) {
    emit('drop-into', {
      parentId: props.node.id,
      dragPayload
    })
    return
  }

  if (!isRoot.value) {
    emit('drop-after', {
      targetId: props.node.id,
      dragPayload
    })
  }
}

function shouldInsertAfter(event: DragEvent): boolean {
  if (isRoot.value) {
    return false
  }
  if (!canRenderChildren.value) {
    return true
  }
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const rect = target.getBoundingClientRect()
  if (rect.height <= 0) {
    return false
  }
  const offsetY = event.clientY - rect.top
  return offsetY > rect.height * 0.75
}

function parseDragPayload(event: DragEvent): DragPayload | null {
  const transfer = event.dataTransfer
  if (!transfer) {
    return null
  }

  const materialName = transfer.getData('application/x-material')
  if (isMaterialName(materialName)) {
    return {
      type: 'material',
      componentName: materialName
    }
  }

  const nodeId = transfer.getData('application/x-node-id')
  if (nodeId) {
    return {
      type: 'node',
      nodeId
    }
  }
  return null
}

function isMaterialName(value: string): value is MaterialComponentName {
  return MATERIAL_NAMES.includes(value as MaterialComponentName)
}
</script>

<template>
  <component
    :is="resolvedTag"
    :class="[
      runtimeClass,
      isDesignerMode ? 'designer-node' : '',
      isSelected ? 'designer-node-selected' : '',
      isDesignerMode && canRenderChildren ? 'designer-can-drop' : ''
    ]"
    :style="mergedStyle"
    :draggable="isDesignerMode && !isRoot"
    v-bind="componentAttrs"
    @click="handleClick"
    @input="handleInput"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @dragover="onDragOver"
    @drop.stop="onDrop"
  >
    <template v-if="canRenderChildren">
      <RenderNode
        v-for="child in node.children ?? []"
        :key="child.id"
        :node="child"
        :model="model"
        :mode="props.mode"
        :selected-id="props.selectedId"
        @button-click="emit('button-click', $event)"
        @select="emit('select', $event)"
        @drop-into="emit('drop-into', $event)"
        @drop-after="emit('drop-after', $event)"
        @drag-node-start="emit('drag-node-start', $event)"
        @drag-node-end="emit('drag-node-end')"
      />
    </template>
    <template v-else-if="isButton">{{ buttonText }}</template>
    <template v-else-if="isText">{{ textContent }}</template>
  </component>
</template>

<style scoped>
.runtime-container {
  border-radius: 10px;
  background: #ffffff;
}

.runtime-layout {
  width: 100%;
}

.runtime-button {
  transition: filter 0.15s ease;
}

.runtime-button:hover {
  filter: brightness(0.95);
}

.runtime-button-primary {
  background: #0f766e;
  color: #ffffff;
}

.runtime-button-default {
  background: #475569;
  color: #ffffff;
}

.runtime-text {
  line-height: 1.5;
}

.designer-node {
  transition: outline-color 0.12s ease;
}

.designer-node-selected {
  outline: 2px solid #fb7185;
  outline-offset: 2px;
}

.designer-can-drop {
  min-height: 38px;
}
</style>
