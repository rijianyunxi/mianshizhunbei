import { ref, computed } from 'vue'
import type { TableDSL, CellSchema, CellSelection, CellPosition } from '../types'

let cellIdCounter = 0

function generateCellId(): string {
  return `cell_${++cellIdCounter}_${Date.now()}`
}

function generateRowId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createDefaultCell(overrides: Partial<CellSchema> = {}): CellSchema {
  return {
    id: generateCellId(),
    type: 'static',
    text: '',
    fieldKey: '',
    rowspan: 1,
    colspan: 1,
    textAlign: 'left',
    ...overrides,
  }
}

function deepCloneDSL(dsl: TableDSL): TableDSL {
  return JSON.parse(JSON.stringify(dsl))
}

const MAX_HISTORY = 50

function createDefault5x5(): TableDSL {
  const rows: TableDSL['rows'] = []
  for (let i = 0; i < 5; i++) {
    rows.push({
      id: generateRowId(),
      type: 'normal',
      cells: [createDefaultCell(), createDefaultCell(), createDefaultCell(), createDefaultCell(), createDefaultCell()],
    })
  }
  return {
    id: `table_${Date.now()}`,
    name: '未命名报表',
    rows,
    colCount: 5,
  }
}

export function useTableDSL(_initialName = '未命名报表') {
  const dsl = ref<TableDSL>(createDefault5x5())

  const selectedCell = ref<CellPosition | null>(null)
  const selection = ref<CellSelection | null>(null)
  const isSelecting = ref(false)

  const undoStack = ref<TableDSL[]>([])
  const redoStack = ref<TableDSL[]>([])

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const selectedCellSchema = computed<CellSchema | null>(() => {
    if (!selectedCell.value) return null
    const { rowIndex, colIndex } = selectedCell.value
    return getCellAt(rowIndex, colIndex)
  })

  function pushHistory() {
    undoStack.value.push(deepCloneDSL(dsl.value))
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  function undo() {
    if (!canUndo.value) return
    redoStack.value.push(deepCloneDSL(dsl.value))
    dsl.value = undoStack.value.pop()!
    selectedCell.value = null
    selection.value = null
  }

  function redo() {
    if (!canRedo.value) return
    undoStack.value.push(deepCloneDSL(dsl.value))
    dsl.value = redoStack.value.pop()!
    selectedCell.value = null
    selection.value = null
  }

  function addRow(afterIndex: number, type: 'normal' | 'loop' = 'normal', loopKey = '') {
    pushHistory()
    const cells: CellSchema[] = []
    for (let i = 0; i < dsl.value.colCount; i++) {
      cells.push(createDefaultCell())
    }
    const newRow = {
      id: generateRowId(),
      type,
      loopKey,
      cells,
    }
    dsl.value.rows.splice(afterIndex + 1, 0, newRow)
  }

  function deleteRow(rowIndex: number) {
    if (dsl.value.rows.length <= 1) return
    pushHistory()
    dsl.value.rows.splice(rowIndex, 1)
    if (selectedCell.value?.rowIndex === rowIndex) {
      selectedCell.value = null
    }
  }

  function addCol(afterIndex: number) {
    pushHistory()
    dsl.value.rows.forEach((row) => {
      let insertOffset = 0
      for (let i = 0; i <= afterIndex && i < row.cells.length; i++) {
        const cell = row.cells[i]
        if (cell) {
          insertOffset += cell.colspan
        }
      }
      row.cells.splice(insertOffset, 0, createDefaultCell())
    })
    dsl.value.colCount++
  }

  function deleteCol(colIndex: number) {
    if (dsl.value.colCount <= 1) return
    pushHistory()
    dsl.value.rows.forEach((row) => {
      let currentCol = 0
      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i]
        if (!cell) continue
        if (currentCol === colIndex) {
          if (cell.colspan > 1) {
            cell.colspan--
          } else {
            row.cells.splice(i, 1)
          }
          break
        }
        currentCol += cell.colspan
      }
    })
    dsl.value.colCount--
  }

  function canMergeCells(sel: CellSelection): boolean {
    const { startRow, startCol, endRow, endCol } = sel
    if (startRow === endRow && startCol === endCol) return false
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = getCellAt(r, c)
        if (!cell) return false
        if (cell.rowspan > 1 || cell.colspan > 1) return false
      }
    }
    return true
  }

  function mergeCells(sel: CellSelection) {
    if (!canMergeCells(sel)) return
    pushHistory()
    const { startRow, startCol, endRow, endCol } = sel
    const rowspan = endRow - startRow + 1
    const colspan = endCol - startCol + 1

    for (let r = startRow; r <= endRow; r++) {
      const row = dsl.value.rows[r]
      if (!row) continue

      const cellsToRemove: number[] = []
      let currentCol = 0
      for (let i = 0; i < row.cells.length; i++) {
        const cell = row.cells[i]
        if (!cell) continue

        const cellStartCol = currentCol
        const cellEndCol = currentCol + cell.colspan - 1
        const originalColspan = cell.colspan

        if (cellStartCol >= startCol && cellEndCol <= endCol) {
          if (r === startRow && cellStartCol === startCol) {
            cell.rowspan = rowspan
            cell.colspan = colspan
          } else {
            cellsToRemove.push(i)
          }
        }

        currentCol += originalColspan
      }

      const reversedToRemove = [...cellsToRemove].reverse()
      for (const idx of reversedToRemove) {
        row.cells.splice(idx, 1)
      }
    }

    selection.value = null
  }

  function splitCell(rowIndex: number, colIndex: number) {
    const cell = getCellAt(rowIndex, colIndex)
    if (!cell || (cell.rowspan === 1 && cell.colspan === 1)) return

    pushHistory()
    const savedRowspan = cell.rowspan
    const savedColspan = cell.colspan

    if (savedColspan > 1) {
      const row = dsl.value.rows[rowIndex]
      if (row) {
        const cellIndex = getCellIndexAt(rowIndex, colIndex)
        if (cellIndex !== -1) {
          for (let c = 1; c < savedColspan; c++) {
            row.cells.splice(cellIndex + c, 0, createDefaultCell())
          }
        }
      }
    }

    if (savedRowspan > 1) {
      for (let r = 1; r < savedRowspan; r++) {
        const targetRow = dsl.value.rows[rowIndex + r]
        if (targetRow) {
          let insertCol = 0
          let currentCol = 0
          for (let i = 0; i < targetRow.cells.length; i++) {
            const c = targetRow.cells[i]
            if (!c) continue
            if (currentCol >= colIndex) {
              insertCol = i
              break
            }
            currentCol += c.colspan
            insertCol = i + 1
          }
          for (let c = 0; c < savedColspan; c++) {
            targetRow.cells.splice(insertCol + c, 0, createDefaultCell())
          }
        }
      }
    }

    cell.rowspan = 1
    cell.colspan = 1
  }

  function getCellAt(rowIndex: number, colIndex: number): CellSchema | null {
    const row = dsl.value.rows[rowIndex]
    if (!row) return null
    let currentCol = 0
    for (const cell of row.cells) {
      if (colIndex >= currentCol && colIndex < currentCol + cell.colspan) {
        return cell
      }
      currentCol += cell.colspan
    }
    return null
  }

  function getCellIndexAt(rowIndex: number, colIndex: number): number {
    const row = dsl.value.rows[rowIndex]
    if (!row) return -1
    let currentCol = 0
    for (let i = 0; i < row.cells.length; i++) {
      const cell = row.cells[i]
      if (!cell) continue
      if (colIndex >= currentCol && colIndex < currentCol + cell.colspan) {
        return i
      }
      currentCol += cell.colspan
    }
    return -1
  }

  function getRenderRows() {
    const result: Array<{ row: typeof dsl.value.rows[number], dataIndex: number, loopIndex?: number }> = []
    dsl.value.rows.forEach((row, rowIndex) => {
      result.push({ row, dataIndex: rowIndex })
    })
    return result
  }

  function exportDSL(): string {
    return JSON.stringify(dsl.value, null, 2)
  }

  function importDSL(json: string) {
    pushHistory()
    try {
      const parsed = JSON.parse(json) as TableDSL
      dsl.value = parsed
    } catch {
      console.error('Invalid DSL JSON')
      undoStack.value.pop()
    }
  }

  function reset() {
    pushHistory()
    cellIdCounter = 0
    dsl.value = createDefault5x5()
    selectedCell.value = null
    selection.value = null
  }

  return {
    dsl,
    selectedCell,
    selection,
    isSelecting,
    selectedCellSchema,
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    undo,
    redo,
    addRow,
    deleteRow,
    addCol,
    deleteCol,
    canMergeCells,
    mergeCells,
    splitCell,
    getCellAt,
    getCellIndexAt,
    getRenderRows,
    exportDSL,
    importDSL,
    reset,
  }
}
