<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from './types'
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
  getCellStartCol,
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

const tableMinWidth = computed(() => {
  const widths = dsl.value.colWidths ?? []
  const totalWidth = widths.length > 0
    ? widths.reduce((sum, width) => sum + width, 0)
    : dsl.value.colCount * DEFAULT_COL_WIDTH

  return `${totalWidth}px`
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

function canSplitCell(rowIndex: number, colIndex: number): boolean {
  const cell = getCellAt(rowIndex, colIndex)
  return cell !== null && (cell.rowspan > 1 || cell.colspan > 1)
}

function getColWidth(colIndex: number): number {
  return dsl.value.colWidths?.[colIndex] ?? DEFAULT_COL_WIDTH
}

function getRowHeight(rowIndex: number): number {
  return dsl.value.rows[rowIndex]?.height ?? DEFAULT_ROW_HEIGHT
}

function getCellHeight(rowIndex: number, rowspan: number): number {
  let totalHeight = 0
  for (let offset = 0; offset < rowspan; offset++) {
    totalHeight += getRowHeight(rowIndex + offset)
  }
  return totalHeight
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
    <table class="editor-table" :style="{ minWidth: tableMinWidth }">
      <colgroup>
        <col
          v-for="(_, colIndex) in dsl.colCount"
          :key="colIndex"
          :style="{ width: `${getColWidth(colIndex)}px` }"
        >
      </colgroup>

      <template v-for="(row, rowIndex) in dsl.rows" :key="row.id">
        <tr :class="{ 'loop-row': row.type === 'loop' }">
          <template v-for="(cell, cellIdx) in row.cells" :key="cell.id">
            <td
              :rowspan="cell.rowspan"
              :colspan="cell.colspan"
              :style="{ textAlign: cell.textAlign }"
              :class="{
                'selected-cell': isCellSelected(rowIndex, getCellStartCol(rowIndex, cellIdx)),
                'in-selection': isCellInSelection(rowIndex, getCellStartCol(rowIndex, cellIdx)),
              }"
              @mousedown="handleCellMouseDown(rowIndex, getCellStartCol(rowIndex, cellIdx), $event)"
              @mouseenter="handleCellMouseEnter(rowIndex, getCellStartCol(rowIndex, cellIdx))"
              @click="handleCellClick(rowIndex, getCellStartCol(rowIndex, cellIdx))"
              @contextmenu="handleCellContextmenu(rowIndex, getCellStartCol(rowIndex, cellIdx), $event)"
            >
              <div class="cell-inner" :style="{ minHeight: `${getCellHeight(rowIndex, cell.rowspan)}px` }">
                <span v-if="cell.type === 'static'" class="cell-content static-cell">{{ cell.text || '静态文本' }}</span>
                <span v-else-if="cell.type === 'master'" class="cell-content bind-cell">
                  <span class="bind-icon">M</span>
                  {{ cell.fieldKey || '未绑定字段' }}
                </span>
                <span v-else-if="cell.type === 'detail'" class="cell-content detail-cell">
                  <span class="bind-icon">D</span>
                  {{ cell.fieldKey || '未绑定字段' }}
                </span>
                <span v-if="row.type === 'loop'" class="loop-badge">循环</span>
              </div>
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
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  user-select: none;

  td {
    border: 1px solid #dcdfe6;
    padding: 0;
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

.cell-inner {
  min-height: 40px;
  padding: 12px 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: relative;
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
  font-weight: 700;
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
  inset: 0;
  z-index: 1999;
}
</style>
