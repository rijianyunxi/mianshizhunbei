<script setup lang="ts">
import { ref, computed } from 'vue'
import TableEditor from './TableEditor.vue'
import CellConfigPanel from './CellConfigPanel.vue'
import CustomFormTable from './CustomFormTable.vue'
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from './types'
import type { CellSchema, CellSelection, FormData } from './types'

const activeTab = ref<'editor' | 'preview' | 'dsl'>('editor')
const showConfigPanel = ref(true)
const selectedCell = ref<CellSchema | null>(null)
const selectedRowIndex = ref(0)
const selectedColIndex = ref(0)
const selectedRowType = ref<'normal' | 'loop'>('normal')
const selectedLoopKey = ref('')
const selectedRowHeight = ref(DEFAULT_ROW_HEIGHT)
const selectedColWidth = ref(DEFAULT_COL_WIDTH)
const currentSelection = ref<CellSelection | null>(null)

const tableEditorRef = ref<InstanceType<typeof TableEditor> | null>(null)

const dsl = computed(() => tableEditorRef.value?.dsl)

const formData = ref<FormData>({
  order_name: '采购单-2024001',
  applicant: '张三',
  department: '技术部',
  date: '2024-01-15',
  purchase_list: [
    { item_name: '笔记本电脑', quantity: 5, price: 6000 },
    { item_name: '显示器', quantity: 10, price: 1500 },
    { item_name: '键盘', quantity: 20, price: 200 },
  ],
})

function handleCellSelect(rowIndex: number, colIndex: number, cell: CellSchema) {
  selectedCell.value = cell
  selectedRowIndex.value = rowIndex
  selectedColIndex.value = colIndex
  if (dsl.value?.rows[rowIndex]) {
    selectedRowType.value = dsl.value.rows[rowIndex].type
    selectedLoopKey.value = dsl.value.rows[rowIndex].loopKey || ''
    selectedRowHeight.value = dsl.value.rows[rowIndex].height ?? DEFAULT_ROW_HEIGHT
    selectedColWidth.value = dsl.value.colWidths?.[colIndex] ?? DEFAULT_COL_WIDTH
  }
}

function handleSelectionChange(selection: CellSelection | null) {
  currentSelection.value = selection
}

function handleCellUpdate(updates: Partial<CellSchema>) {
  if (!selectedCell.value || !dsl.value) return
  Object.assign(selectedCell.value, updates)
}

function handleRowTypeChange(type: 'normal' | 'loop') {
  if (!dsl.value) return
  const row = dsl.value.rows[selectedRowIndex.value]
  if (row) {
    row.type = type
    selectedRowType.value = type
  }
}

function handleLoopKeyChange(key: string) {
  if (!dsl.value) return
  const row = dsl.value.rows[selectedRowIndex.value]
  if (row) {
    row.loopKey = key
    selectedLoopKey.value = key
  }
}

function handleRowHeightChange(height: number) {
  if (!dsl.value) return
  const row = dsl.value.rows[selectedRowIndex.value]
  if (row) {
    row.height = height
    selectedRowHeight.value = height
  }
}

function handleColWidthChange(width: number) {
  if (!dsl.value) return
  dsl.value.colWidths ??= Array.from({ length: dsl.value.colCount }, () => DEFAULT_COL_WIDTH)
  dsl.value.colWidths[selectedColIndex.value] = width
  selectedColWidth.value = width
}

function handleExportDSL() {
  if (!dsl.value) return
  const json = JSON.stringify(dsl.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${dsl.value.name || 'table'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportDSL() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const json = ev.target?.result as string
      tableEditorRef.value?.importDSL(json)
    }
    reader.readAsText(file)
  }
  input.click()
}

const canUndo = computed(() => tableEditorRef.value?.canUndo ?? false)
const canRedo = computed(() => tableEditorRef.value?.canRedo ?? false)

function handleUndo() {
  tableEditorRef.value?.undo()
}

function handleRedo() {
  tableEditorRef.value?.redo()
}

function handleReset() {
  tableEditorRef.value?.reset()
  selectedCell.value = null
  selectedRowHeight.value = DEFAULT_ROW_HEIGHT
  selectedColWidth.value = DEFAULT_COL_WIDTH
}

function handleLoadDemo() {
  if (!dsl.value) return
  const demoDSL = {
    id: 'demo_table',
    name: '采购申请单',
    colCount: 4,
    rows: [
      {
        id: 'r1',
        type: 'normal',
        cells: [
          { id: 'c1', type: 'static', text: '采购申请单', fieldKey: '', rowspan: 1, colspan: 4, textAlign: 'center' },
        ],
      },
      {
        id: 'r2',
        type: 'normal',
        cells: [
          { id: 'c2', type: 'static', text: '单据编号', fieldKey: '', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c3', type: 'master', text: '', fieldKey: 'order_name', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c4', type: 'static', text: '申请日期', fieldKey: '', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c5', type: 'master', text: '', fieldKey: 'date', rowspan: 1, colspan: 1, textAlign: 'left' },
        ],
      },
      {
        id: 'r3',
        type: 'normal',
        cells: [
          { id: 'c6', type: 'static', text: '申请人', fieldKey: '', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c7', type: 'master', text: '', fieldKey: 'applicant', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c8', type: 'static', text: '部门', fieldKey: '', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c9', type: 'master', text: '', fieldKey: 'department', rowspan: 1, colspan: 1, textAlign: 'left' },
        ],
      },
      {
        id: 'r4',
        type: 'normal',
        cells: [
          { id: 'c10', type: 'static', text: '采购明细', fieldKey: '', rowspan: 1, colspan: 4, textAlign: 'center' },
        ],
      },
      {
        id: 'r5',
        type: 'loop',
        loopKey: 'purchase_list',
        cells: [
          { id: 'c11', type: 'detail', text: '', fieldKey: 'item_name', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c12', type: 'static', text: '数量', fieldKey: '', rowspan: 1, colspan: 1, textAlign: 'center' },
          { id: 'c13', type: 'detail', text: '', fieldKey: 'quantity', rowspan: 1, colspan: 1, textAlign: 'left' },
          { id: 'c14', type: 'detail', text: '', fieldKey: 'price', rowspan: 1, colspan: 1, textAlign: 'right' },
        ],
      },
    ],
  }
  tableEditorRef.value?.importDSL(JSON.stringify(demoDSL))
}
</script>

<template>
  <div class="custom-form-table-page">
    <div class="page-header">
      <h2>自定义复杂报表与动态表单引擎</h2>
      <div class="header-actions">
        <button class="icon-btn" :disabled="!canUndo" @click="handleUndo" title="撤销">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button class="icon-btn" :disabled="!canRedo" @click="handleRedo" title="重做">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
        </button>
        <div class="divider" />
        <button @click="handleLoadDemo">加载示例</button>
        <button @click="handleImportDSL">导入 DSL</button>
        <button @click="handleExportDSL">导出 DSL</button>
        <div class="divider" />
        <button class="danger-btn" @click="handleReset">一键初始化</button>
      </div>
    </div>

    <div class="tab-bar">
      <button :class="{ active: activeTab === 'editor' }" @click="activeTab = 'editor'">设计器</button>
      <button :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">数据预览</button>
      <button :class="{ active: activeTab === 'dsl' }" @click="activeTab = 'dsl'">DSL JSON</button>
    </div>

    <div class="main-content">
      <div class="editor-area">
        <div v-show="activeTab === 'editor'" class="tab-content">
          <TableEditor
            ref="tableEditorRef"
            @cell-select="handleCellSelect"
            @selection-change="handleSelectionChange"
          />
        </div>

        <div v-show="activeTab === 'preview'" class="tab-content preview-content">
          <CustomFormTable v-if="dsl" :dsl="dsl" :form-data="formData" />
        </div>

        <div v-show="activeTab === 'dsl'" class="tab-content dsl-view">
          <pre v-if="dsl">{{ JSON.stringify(dsl, null, 2) }}</pre>
        </div>
      </div>

      <div v-if="showConfigPanel && activeTab === 'editor'" class="config-panel-wrapper">
        <CellConfigPanel :row-height="selectedRowHeight" :col-width="selectedColWidth"
          :cell="selectedCell"
          :row-index="selectedRowIndex"
          :col-index="selectedColIndex"
          :row-type="selectedRowType"
          :loop-key="selectedLoopKey"
          @update="handleCellUpdate"
          @update-row-type="handleRowTypeChange"
          @update-loop-key="handleLoopKeyChange"
          @update-row-height="handleRowHeightChange"
          @update-col-width="handleColWidthChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom-form-table-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 16px;
    color: #303133;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    button {
      padding: 6px 12px;
      font-size: 13px;
      border: 1px solid #dcdfe6;
      background: #fff;
      border-radius: 4px;
      cursor: pointer;
      color: #606266;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;

      &:hover:not(:disabled) {
        border-color: #409eff;
        color: #409eff;
      }

      &:disabled {
        color: #c0c4cc;
        cursor: not-allowed;
        border-color: #ebeef5;

        &:hover {
          border-color: #ebeef5;
          color: #c0c4cc;
        }
      }
    }

    .icon-btn {
      padding: 6px 8px;
    }

    .danger-btn {
      color: #f56c6c;
      border-color: #fbc4c4;

      &:hover:not(:disabled) {
        color: #fff;
        background: #f56c6c;
        border-color: #f56c6c;
      }
    }

    .divider {
      width: 1px;
      height: 20px;
      background: #e4e7ed;
      margin: 0 4px;
    }
  }
}

.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  flex-shrink: 0;

  button {
    padding: 10px 20px;
    font-size: 14px;
    border: none;
    background: none;
    cursor: pointer;
    color: #606266;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &:hover {
      color: #409eff;
    }

    &.active {
      color: #409eff;
      border-bottom-color: #409eff;
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.editor-area {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 16px;
  background: #fff;
  margin: 16px 16px 16px 0;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.tab-content {
  height: 100%;
}

.preview-content {
  overflow: auto;
}

.dsl-view {
  pre {
    margin: 0;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.6;
    overflow: auto;
    height: 100%;
    box-sizing: border-box;
  }
}

.config-panel-wrapper {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid #e4e7ed;
  background: #fff;
}

.page-footer {
  padding: 8px 24px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}
</style>
