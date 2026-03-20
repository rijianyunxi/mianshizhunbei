<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import RenderNode from './components/render/RenderNode.vue'
import { loadSchemaFromStorage, saveSchemaToStorage } from './schema/storage'
import {
  addMaterialToParent,
  deleteNode,
  findNode,
  findNodeLocation,
  moveNode
} from './schema/tree'
import type { ComponentNode, DragPayload, MaterialDefinition, PageSchema } from './schema/types'
import { ROOT_NODE_ID } from './schema/types'

const materials: MaterialDefinition[] = [
  {
    componentName: 'Container',
    label: 'Container',
    description: '容器，可继续拖入子组件'
  },
  {
    componentName: 'Layout',
    label: 'Layout',
    description: '布局容器，支持 flex 排版'
  },
  {
    componentName: 'Button',
    label: 'Button',
    description: '按钮，验证事件绑定'
  },
  {
    componentName: 'Input',
    label: 'Input',
    description: '输入框，验证双向绑定'
  },
  {
    componentName: 'Text',
    label: 'Text',
    description: '纯文本，验证静态渲染'
  }
]

type Mode = 'designer' | 'preview'

const mode = ref<Mode>(resolveMode())
const pageSchema = ref<PageSchema>(loadSchemaFromStorage())
const selectedId = ref<string>(ROOT_NODE_ID)
const saveMessage = ref<string>('')
const draggingNodeId = ref<string>('')
const runtimeModel = reactive<Record<string, string>>({})

const isPreviewMode = computed(() => mode.value === 'preview')
const selectedNode = computed<ComponentNode>(() => {
  return findNode(pageSchema.value.componentsTree, selectedId.value) ?? pageSchema.value.componentsTree
})
const schemaJson = computed(() => JSON.stringify(pageSchema.value, null, 2))
const treeLines = computed(() => buildTreeLines(pageSchema.value.componentsTree))

watch(
  () => pageSchema.value,
  () => {
    if (mode.value === 'designer') {
      saveSchemaToStorage(pageSchema.value)
    }
    if (!findNode(pageSchema.value.componentsTree, selectedId.value)) {
      selectedId.value = ROOT_NODE_ID
    }
  },
  { deep: true }
)

function resolveMode(): Mode {
  if (typeof window === 'undefined') {
    return 'designer'
  }
  const currentMode = new URLSearchParams(window.location.search).get('mode')
  return currentMode === 'preview' ? 'preview' : 'designer'
}

function buildTreeLines(root: ComponentNode, depth = 0): Array<{ id: string; label: string; depth: number }> {
  const lines: Array<{ id: string; label: string; depth: number }> = [
    {
      id: root.id,
      label: root.componentName,
      depth
    }
  ]
  for (const child of root.children ?? []) {
    lines.push(...buildTreeLines(child, depth + 1))
  }
  return lines
}

function onMaterialDragStart(componentName: MaterialDefinition['componentName'], event: DragEvent): void {
  const transfer = event.dataTransfer
  if (!transfer) {
    return
  }
  transfer.effectAllowed = 'copy'
  transfer.setData('application/x-material', componentName)
}

function onCanvasRootDrop(event: DragEvent): void {
  const dragPayload = extractDragPayload(event)
  if (!dragPayload) {
    return
  }
  applyDropInto(ROOT_NODE_ID, dragPayload)
}

function onDropInto(payload: { parentId: string; dragPayload: DragPayload }): void {
  applyDropInto(payload.parentId, payload.dragPayload)
}

function onDropAfter(payload: { targetId: string; dragPayload: DragPayload }): void {
  const location = findNodeLocation(pageSchema.value.componentsTree, payload.targetId)
  if (!location || !location.parent) {
    return
  }
  const parentId = location.parent.id
  const nextIndex = location.index + 1

  if (payload.dragPayload.type === 'material') {
    const created = addMaterialToParent(
      pageSchema.value.componentsTree,
      parentId,
      payload.dragPayload.componentName,
      nextIndex
    )
    if (created) {
      selectedId.value = created.id
    }
    return
  }

  const moved = moveNode(pageSchema.value.componentsTree, payload.dragPayload.nodeId, parentId, nextIndex)
  if (moved) {
    selectedId.value = payload.dragPayload.nodeId
  }
}

function applyDropInto(parentId: string, dragPayload: DragPayload): void {
  if (dragPayload.type === 'material') {
    const created = addMaterialToParent(pageSchema.value.componentsTree, parentId, dragPayload.componentName)
    if (created) {
      selectedId.value = created.id
    }
    return
  }

  const parentNode = findNode(pageSchema.value.componentsTree, parentId)
  if (!parentNode) {
    return
  }
  const targetIndex = parentNode.children?.length ?? 0
  const moved = moveNode(pageSchema.value.componentsTree, dragPayload.nodeId, parentId, targetIndex)
  if (moved) {
    selectedId.value = dragPayload.nodeId
  }
}

function addMaterialByClick(componentName: MaterialDefinition['componentName']): void {
  const created = addMaterialToParent(pageSchema.value.componentsTree, ROOT_NODE_ID, componentName)
  if (created) {
    selectedId.value = created.id
  }
}

function extractDragPayload(event: DragEvent): DragPayload | null {
  const transfer = event.dataTransfer
  if (!transfer) {
    return null
  }

  const materialName = transfer.getData('application/x-material')
  if (
    materialName === 'Container' ||
    materialName === 'Layout' ||
    materialName === 'Button' ||
    materialName === 'Input' ||
    materialName === 'Text'
  ) {
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

function setSelectedNode(id: string): void {
  selectedId.value = id
}

function onNodeDragStart(nodeId: string): void {
  draggingNodeId.value = nodeId
}

function onNodeDragEnd(): void {
  draggingNodeId.value = ''
}

function updateProp(key: string, value: string): void {
  selectedNode.value.props[key] = value
}

function updateStyle(key: string, value: string): void {
  if (!selectedNode.value.style) {
    selectedNode.value.style = {}
  }
  selectedNode.value.style[key] = value
}

function getPropAsString(key: string, fallback = ''): string {
  const value = selectedNode.value.props[key]
  return typeof value === 'string' ? value : fallback
}

function getStyleAsString(key: string, fallback = ''): string {
  const value = selectedNode.value.style?.[key]
  return typeof value === 'string' ? value : fallback
}

function onPropInput(key: string, event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return
  }
  updateProp(key, target.value)
}

function onStyleInput(key: string, event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    return
  }
  updateStyle(key, target.value)
}

function removeCurrentNode(): void {
  if (selectedNode.value.id === ROOT_NODE_ID) {
    return
  }
  const removed = deleteNode(pageSchema.value.componentsTree, selectedNode.value.id)
  if (removed) {
    selectedId.value = ROOT_NODE_ID
  }
}

function saveSchema(): void {
  saveSchemaToStorage(pageSchema.value)
  saveMessage.value = `已保存 ${new Date().toLocaleTimeString()}`
}

function saveAndPreview(): void {
  saveSchema()
  if (typeof window === 'undefined') {
    return
  }
  const previewUrl = `${window.location.origin}${window.location.pathname}?mode=preview`
  window.open(previewUrl, '_blank', 'noopener')
}

function openDesigner(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.location.href = `${window.location.origin}${window.location.pathname}`
}

function onRuntimeButtonClick(payload: { id: string; message: string }): void {
  window.alert(`[${payload.id.slice(0, 8)}] ${payload.message}`)
}
</script>

<template>
  <div v-if="isPreviewMode" class="preview-mode">
    <header class="preview-head">
      <div>
        <h1>Renderer Preview</h1>
        <p>运行时递归渲染（Vue 3 + component:is）</p>
      </div>
      <button type="button" class="ghost-btn" @click="openDesigner">返回设计器</button>
    </header>

    <main class="preview-canvas">
      <RenderNode :node="pageSchema.componentsTree" :model="runtimeModel" @button-click="onRuntimeButtonClick" />
    </main>

    <section class="preview-json">
      <h2>Schema JSON</h2>
      <pre>{{ schemaJson }}</pre>
    </section>
  </div>

  <div v-else class="designer-mode">
    <aside class="panel materials-panel">
      <h2>物料面板</h2>
      <p>拖拽到画布，或点击快速添加到根容器</p>
      <div class="materials-list">
        <article
          v-for="material in materials"
          :key="material.componentName"
          class="material-item"
          draggable="true"
          @dragstart="onMaterialDragStart(material.componentName, $event)"
        >
          <h3>{{ material.label }}</h3>
          <p>{{ material.description }}</p>
          <button type="button" class="ghost-btn" @click="addMaterialByClick(material.componentName)">点击添加</button>
        </article>
      </div>
    </aside>

    <section class="panel canvas-panel">
      <header class="canvas-head">
        <div>
          <h2>可视化画布</h2>
          <p v-if="draggingNodeId">正在拖拽节点：{{ draggingNodeId.slice(0, 8) }}</p>
          <p v-else>支持嵌套、排序、选中高亮和毫秒级属性热更新</p>
        </div>
        <div class="head-actions">
          <button type="button" class="ghost-btn" @click="saveSchema">保存</button>
          <button type="button" class="solid-btn" @click="saveAndPreview">保存并预览</button>
        </div>
      </header>

      <p v-if="saveMessage" class="save-tip">{{ saveMessage}}</p>

      <div class="canvas-drop-root" @dragover.prevent @drop="onCanvasRootDrop">
        <RenderNode
          :node="pageSchema.componentsTree"
          :model="runtimeModel"
          mode="designer"
          :selected-id="selectedId"
          @select="setSelectedNode"
          @drop-into="onDropInto"
          @drop-after="onDropAfter"
          @drag-node-start="onNodeDragStart"
          @drag-node-end="onNodeDragEnd"
        />
      </div>

      <section class="tree-panel">
        <h3>DOM 树视图</h3>
        <div class="tree-lines">
          <button
            v-for="line in treeLines"
            :key="line.id"
            type="button"
            class="tree-line"
            :class="{ active: line.id === selectedId }"
            :style="{ paddingLeft: `${line.depth * 16 + 8}px` }"
            @click="setSelectedNode(line.id)"
          >
            {{ line.label }} · {{ line.id.slice(0, 8) }}
          </button>
        </div>
      </section>
    </section>

    <aside class="panel settings-panel">
      <h2>属性配置</h2>
      <p>当前选中：{{ selectedNode.componentName }}（{{ selectedNode.id.slice(0, 8) }}）</p>

      <section v-if="selectedNode.componentName === 'Container'" class="settings-group">
        <h3>Container Props</h3>
        <label>
          标题
          <input :value="getPropAsString('title', '容器')" @input="onPropInput('title', $event)" />
        </label>
      </section>

      <section v-if="selectedNode.componentName === 'Layout'" class="settings-group">
        <h3>Layout Props</h3>
        <label>
          Direction
          <select :value="getPropAsString('direction', 'row')" @change="onPropInput('direction', $event)">
            <option value="row">row</option>
            <option value="column">column</option>
          </select>
        </label>
        <label>
          Justify Content
          <select :value="getPropAsString('justifyContent', 'flex-start')" @change="onPropInput('justifyContent', $event)">
            <option value="flex-start">flex-start</option>
            <option value="center">center</option>
            <option value="flex-end">flex-end</option>
            <option value="space-between">space-between</option>
            <option value="space-around">space-around</option>
            <option value="space-evenly">space-evenly</option>
          </select>
        </label>
        <label>
          Align Items
          <select :value="getPropAsString('alignItems', 'stretch')" @change="onPropInput('alignItems', $event)">
            <option value="stretch">stretch</option>
            <option value="flex-start">flex-start</option>
            <option value="center">center</option>
            <option value="flex-end">flex-end</option>
          </select>
        </label>
        <label>
          Gap
          <input :value="getPropAsString('gap', '12px')" @input="onPropInput('gap', $event)" />
        </label>
      </section>

      <section v-if="selectedNode.componentName === 'Button'" class="settings-group">
        <h3>Button Props</h3>
        <label>
          文案
          <input :value="getPropAsString('text', '按钮')" @input="onPropInput('text', $event)" />
        </label>
        <label>
          类型
          <select :value="getPropAsString('type', 'default')" @change="onPropInput('type', $event)">
            <option value="default">default</option>
            <option value="primary">primary</option>
          </select>
        </label>
        <label>
          点击提示
          <textarea
            :value="getPropAsString('onClickMessage', '按钮点击成功')"
            @input="onPropInput('onClickMessage', $event)"
          />
        </label>
      </section>

      <section v-if="selectedNode.componentName === 'Input'" class="settings-group">
        <h3>Input Props</h3>
        <label>
          Placeholder
          <input :value="getPropAsString('placeholder', '请输入内容')" @input="onPropInput('placeholder', $event)" />
        </label>
        <label>
          默认值
          <input :value="getPropAsString('value')" @input="onPropInput('value', $event)" />
        </label>
      </section>

      <section v-if="selectedNode.componentName === 'Text'" class="settings-group">
        <h3>Text Props</h3>
        <label>
          文案
          <textarea :value="getPropAsString('text', '这是一段文本')" @input="onPropInput('text', $event)" />
        </label>
      </section>

      <section class="settings-group">
        <h3>Style</h3>
        <label>
          Margin
          <input :value="getStyleAsString('margin')" @input="onStyleInput('margin', $event)" />
        </label>
        <label>
          Padding
          <input :value="getStyleAsString('padding')" @input="onStyleInput('padding', $event)" />
        </label>
        <label>
          Color
          <input :value="getStyleAsString('color')" @input="onStyleInput('color', $event)" />
        </label>
      </section>

      <section class="settings-group danger-zone">
        <button type="button" class="danger-btn" :disabled="selectedNode.id === ROOT_NODE_ID" @click="removeCurrentNode">
          删除当前组件
        </button>
      </section>

      <section class="settings-group">
        <h3>Schema 输出</h3>
        <pre>{{ schemaJson }}</pre>
      </section>
    </aside>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'IBM Plex Sans', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  color: #0f172a;
  background: linear-gradient(120deg, #ecfeff 0%, #fff7ed 55%, #eef2ff 100%);
}

:global(*) {
  box-sizing: border-box;
}

.designer-mode {
  min-height: 100vh;
  padding: 16px;
  display: grid;
  grid-template-columns: 270px 1fr 320px;
  gap: 14px;
}

.panel {
  background: rgb(255 255 255 / 88%);
  border: 1px solid #dbeafe;
  border-radius: 16px;
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 28px rgb(15 23 42 / 8%);
  padding: 14px;
}

.panel h2,
.panel h3,
.panel p {
  margin-top: 0;
}

.materials-list {
  display: grid;
  gap: 10px;
}

.material-item {
  border: 1px solid #c7d2fe;
  background: linear-gradient(135deg, #f8fafc, #fefce8);
  border-radius: 12px;
  padding: 10px;
}

.material-item h3 {
  margin: 0 0 4px 0;
}

.material-item p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #475569;
}

.canvas-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.canvas-head p {
  color: #475569;
}

.head-actions {
  display: flex;
  gap: 8px;
}

.save-tip {
  font-size: 13px;
  color: #0369a1;
  background: #f0f9ff;
  border: 1px solid #38bdf8;
  border-radius: 10px;
  padding: 8px 10px;
}

.canvas-drop-root {
  margin-top: 12px;
  border: 2px solid #67e8f9;
  border-radius: 14px;
  padding: 12px;
  background: rgb(240 249 255 / 58%);
  min-height: 260px;
}

.tree-panel {
  margin-top: 14px;
  border-top: 1px solid #dbeafe;
  padding-top: 12px;
}

.tree-lines {
  display: grid;
  gap: 6px;
}

.tree-line {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  text-align: left;
  background: #ffffff;
  padding: 8px;
  color: #334155;
}

.tree-line.active {
  border-color: #fb7185;
  color: #be123c;
  background: #fff1f2;
}

.settings-group {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  background: #ffffff;
}

.settings-group label {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #334155;
}

.settings-group input,
.settings-group select,
.settings-group textarea {
  border: 1px solid #94a3b8;
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  font-family: inherit;
}

.settings-group textarea {
  resize: vertical;
  min-height: 68px;
}

.settings-group pre,
.preview-json pre {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  border-radius: 8px;
  background: #0f172a;
  color: #bfdbfe;
  padding: 10px;
  font-size: 12px;
}

.danger-zone {
  background: #fff7ed;
  border-color: #fdba74;
}

.ghost-btn,
.solid-btn,
.danger-btn {
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}

.ghost-btn {
  border: 1px solid #38bdf8;
  background: #f0f9ff;
  color: #0369a1;
}

.solid-btn {
  border: 1px solid #0f766e;
  background: #0f766e;
  color: #ffffff;
}

.danger-btn {
  border: 1px solid #ef4444;
  background: #ef4444;
  color: #ffffff;
  width: 100%;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-mode {
  min-height: 100vh;
  padding: 18px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 14px;
}

.preview-head {
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 14px;
  background: rgb(240 249 255 / 70%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-head h1 {
  margin: 0;
}

.preview-head p {
  margin: 4px 0 0 0;
  color: #475569;
}

.preview-canvas {
  border: 2px solid #67e8f9;
  border-radius: 16px;
  padding: 14px;
  background: rgb(255 255 255 / 86%);
  min-height: 320px;
}

.preview-json {
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  padding: 12px;
  background: rgb(255 255 255 / 88%);
}

@media (max-width: 1100px) {
  .designer-mode {
    grid-template-columns: 1fr;
  }

  .canvas-head {
    flex-direction: column;
  }

  .head-actions {
    width: 100%;
  }

  .head-actions button {
    flex: 1;
  }
}
</style>
