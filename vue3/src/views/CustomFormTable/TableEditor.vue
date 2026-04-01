<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CellSchema, CellSelection } from './types'
import { useTableDSL } from './composables/useTableDSL'

const emit = defineEmits<{
  cellSelect: [rowIndex: number, colIndex: number, cell: CellSchema]
  selectionChange: [selection: CellSelection | null]
}>()

const props = defineProps<{
  initialName?: string
}>()

const {
  dsl,
  selectedCell,
  selection,
  isSelecting,
  addRow,
  deleteRow,
  addCol,
  deleteCol,
  canMergeCells,
  mergeCells,
  splitCell,
  getCellAt,
  importDSL,
  reset,
  undo,
  redo,
  canUndo,
  canRedo,
} = useTableDSL(props.initialName)

const mouseDownPos = ref<{ row: number, col: number } | null>(null)
const contextMenuPos = ref<{ x: number, y: number } | null>(null)
const contextCellPos = ref<{ rowIndex: number, colIndex: number } | null>(null)
const showContextMenu = ref(false)

const canMerge = computed(() => {
  if (!selection.value) return false
  return canMergeCells(selection.value)
})

function handleCellMouseDown(rowIndex: number, colIndex: number, e: MouseEvent) {
  if (e.button === 2) {
    contextCellPos.value = { rowIndex, colIndex }
    return
  }
  e.preventDefault()
  mouseDownPos.value = { row: rowIndex, col: colIndex }
  selectedCell.value = { rowIndex, colIndex }
  isSelecting.value = true
  selection.value = null
}

function handleCellMouseEnter(rowIndex: number, colIndex: number) {
  if (!isSelecting.value || !mouseDownPos.value) return
  const startRow = Math.min(mouseDownPos.value.row, rowIndex)
  const startCol = Math.min(mouseDownPos.value.col, colIndex)
  const endRow = Math.max(mouseDownPos.value.row, rowIndex)
  const endCol = Math.max(mouseDownPos.value.col, colIndex)
  selection.value = { startRow, startCol, endRow, endCol }
}

function handleMouseUp() {
  isSelecting.value = false
  if (selection.value && selection.value.startRow === selection.value.endRow && selection.value.startCol === selection.value.endCol) {
    selection.value = null
  }
  emit('selectionChange', selection.value)
}

function handleCellClick(rowIndex: number, colIndex: number) {
  const cell = getCellAt(rowIndex, colIndex)
  if (cell) {
    emit('cellSelect', rowIndex, colIndex, cell)
  }
}

function handleCellContextmenu(rowIndex: number, colIndex: number, e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  contextCellPos.value = { rowIndex, colIndex }
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  showContextMenu.value = true
}

function closeContextMenu() {
  showContextMenu.value = false
  contextMenuPos.value = null
}

function handleMerge() {
  if (selection.value && canMerge.value) {
    mergeCells(selection.value)
    emit('selectionChange', null)
  }
  closeContextMenu()
}

function handleSplit() {
  if (contextCellPos.value) {
    splitCell(contextCellPos.value.rowIndex, contextCellPos.value.colIndex)
  }
  closeContextMenu()
}

function handleAddRowAbove() {
  if (contextCellPos.value) {
    addRow(contextCellPos.value.rowIndex - 1)
  }
  closeContextMenu()
}

function handleAddRowBelow() {
  if (contextCellPos.value) {
    addRow(contextCellPos.value.rowIndex)
  }
  closeContextMenu()
}

function handleAddColLeft() {
  if (contextCellPos.value) {
    addCol(contextCellPos.value.colIndex - 1)
  }
  closeContextMenu()
}

function handleAddColRight() {
  if (contextCellPos.value) {
    addCol(contextCellPos.value.colIndex)
  }
  closeContextMenu()
}

function handleDeleteRow() {
  if (contextCellPos.value) {
    deleteRow(contextCellPos.value.rowIndex)
  }
  closeContextMenu()
}

function handleDeleteCol() {
  if (contextCellPos.value) {
    deleteCol(contextCellPos.value.colIndex)
  }
  closeContextMenu()
}

function isCellInSelection(rowIndex: number, colIndex: number): boolean {
  if (!selection.value) return false
  const { startRow, startCol, endRow, endCol } = selection.value
  return rowIndex >= startRow && rowIndex <= endRow && colIndex >= startCol && colIndex <= endCol
}

function isCellSelected(rowIndex: number, colIndex: number): boolean {
  return selectedCell.value?.rowIndex === rowIndex && selectedCell.value?.colIndex === colIndex
}

function getActualColIndex(row: typeof dsl.value.rows[number], cellIdx: number): number {
  let col = 0
  for (let i = 0; i < cellIdx; i++) {
    col += row.cells[i].colspan
  }
  return col
}

function canSplitCell(rowIndex: number, colIndex: number): boolean {
  const cell = getCellAt(rowIndex, colIndex)
  return cell !== null && (cell.rowspan > 1 || cell.colspan > 1)
}

defineExpose({
  dsl,
  selectedCell,
  selection,
  importDSL,
  reset,
  undo,
  redo,
  canUndo,
  canRedo,
})
</script>

<template>
  <div
    class="table-editor"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <table class="editor-table">
      <template v-for="(row, rowIndex) in dsl.rows" :key="row.id">
        <tr
          v-for="(_, idx) in (row.type === 'loop' ? [0] : [0])"
          :key="`${row.id}_${idx}`"
          :class="{ 'loop-row': row.type === 'loop' }"
        >
          <template v-for="(cell, cellIdx) in row.cells" :key="cell.id">
            <td
              :rowspan="cell.rowspan"
              :colspan="cell.colspan"
              :style="{ textAlign: cell.textAlign, height: cell.rowspan > 1 ? `${cell.rowspan * 48}px` : undefined }"
              :class="{
                'selected-cell': isCellSelected(rowIndex, getActualColIndex(row, cellIdx)),
                'in-selection': isCellInSelection(rowIndex, getActualColIndex(row, cellIdx)),
              }"
              @mousedown="handleCellMouseDown(rowIndex, getActualColIndex(row, cellIdx), $event)"
              @mouseenter="handleCellMouseEnter(rowIndex, getActualColIndex(row, cellIdx))"
              @click="handleCellClick(rowIndex, getActualColIndex(row, cellIdx))"
              @contextmenu="handleCellContextmenu(rowIndex, getActualColIndex(row, cellIdx), $event)"
            >
              <span v-if="cell.type === 'static'" class="cell-content static-cell">{{ cell.text || '静态文本' }}</span>
              <span v-else-if="cell.type === 'master'" class="cell-content bind-cell">
                <span class="bind-icon">📎</span>
                {{ cell.fieldKey || '未绑定' }}
              </span>
              <span v-else-if="cell.type === 'detail'" class="cell-content detail-cell">
                <span class="bind-icon">📋</span>
                {{ cell.fieldKey || '未绑定' }}
              </span>
              <span v-if="row.type === 'loop'" class="loop-badge">循环</span>
            </td>
          </template>
          <td v-if="row.cells.length === 0" :colspan="dsl.colCount" class="row-placeholder" />
        </tr>
      </template>
    </table>

    <div
      v-if="showContextMenu && contextMenuPos"
      class="context-menu"
      :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }"
      @click.stop
    >
      <div class="context-menu-group">
        <div class="context-menu-item" @click="handleAddRowAbove">上方插入行</div>
        <div class="context-menu-item" @click="handleAddRowBelow">下方插入行</div>
        <div class="context-menu-item" @click="handleDeleteRow" :class="{ disabled: dsl.rows.length <= 1 }">删除行</div>
      </div>
      <div class="context-menu-divider" />
      <div class="context-menu-group">
        <div class="context-menu-item" @click="handleAddColLeft">左侧插入列</div>
        <div class="context-menu-item" @click="handleAddColRight">右侧插入列</div>
        <div class="context-menu-item" @click="handleDeleteCol" :class="{ disabled: dsl.colCount <= 1 }">删除列</div>
      </div>
      <div class="context-menu-divider" />
      <div class="context-menu-group">
        <div class="context-menu-item" @click="handleMerge" :class="{ disabled: !canMerge }">合并单元格</div>
        <div
          v-if="contextCellPos && canSplitCell(contextCellPos.rowIndex, contextCellPos.colIndex)"
          class="context-menu-item"
          @click="handleSplit"
        >
          拆分单元格
        </div>
      </div>
    </div>

    <div v-if="showContextMenu" class="context-menu-overlay" @click="closeContextMenu" />
  </div>
</template>

<style scoped lang="scss">
.table-editor {
  position: relative;
  overflow: auto;
}

.editor-table {
  width: 100%;
  border-collapse: collapse;
  user-select: none;

  td {
    border: 1px solid #dcdfe6;
    padding: 12px 16px;
    min-height: 48px;
    cursor: cell;
    position: relative;
    transition: background-color 0.1s;
    font-size: 14px;
    vertical-align: middle;

    &:hover {
      background-color: #ecf5ff;
    }

    &.selected-cell {
      outline: 2px solid #409eff;
      outline-offset: -2px;
    }

    &.in-selection {
      background-color: rgba(64, 158, 255, 0.15);
    }
  }

  .loop-row {
    td {
      background-color: #f5f7fa;
    }
  }
}

.cell-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.static-cell {
  color: #303133;
}

.bind-cell {
  color: #409eff;
  font-weight: 500;
}

.detail-cell {
  color: #67c23a;
  font-weight: 500;
}

.bind-icon {
  font-size: 12px;
}

.loop-badge {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 10px;
  color: #e6a23c;
  background: #fdf6ec;
  padding: 1px 4px;
  border-radius: 2px;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  z-index: 2000;
  min-width: 140px;
}

.context-menu-group {
  padding: 4px 0;
}

.context-menu-item {
  padding: 6px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: #f5f7fa;
    color: #409eff;
  }

  &.disabled {
    color: #c0c4cc;
    cursor: not-allowed;

    &:hover {
      background-color: transparent;
      color: #c0c4cc;
    }
  }
}

.context-menu-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 4px 0;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1999;
}
</style>
