import { ref, computed } from 'vue'
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from '../types'
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

function normalizeDSL(source: TableDSL): TableDSL {
  const colCount = Math.max(1, source.colCount || 1)
  const rows = source.rows.map((row) => ({
    ...row,
    height: typeof row.height === 'number' && row.height > 0 ? row.height : DEFAULT_ROW_HEIGHT,
  }))

  const colWidths = Array.from({ length: colCount }, (_, index) => {
    const width = source.colWidths?.[index]
    return typeof width === 'number' && width > 0 ? width : DEFAULT_COL_WIDTH
  })

  return {
    ...source,
    colCount,
    rows,
    colWidths,
  }
}

const MAX_HISTORY = 50

interface PendingSpan {
  cell: CellSchema
  startCol: number
  colspan: number
  remainingRows: number
}

interface PositionedCell {
  cell: CellSchema
  cellIndex: number
  startCol: number
  endCol: number
}

interface RowLayout {
  cells: PositionedCell[]
  occupiedCols: Map<number, PendingSpan>
}

function createDefault5x5(): TableDSL {
  const rows: TableDSL['rows'] = []
  for (let i = 0; i < 5; i++) {
    rows.push({
      id: generateRowId(),
      type: 'normal',
      height: DEFAULT_ROW_HEIGHT,
      cells: [createDefaultCell(), createDefaultCell(), createDefaultCell(), createDefaultCell(), createDefaultCell()],
    })
  }
  return {
    id: `table_${Date.now()}`,
    name: '未命名报表',
    rows,
    colCount: 5,
    colWidths: Array.from({ length: 5 }, () => DEFAULT_COL_WIDTH),
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
  const tableLayout = computed<RowLayout[]>(() => {
    const layouts: RowLayout[] = []
    let pendingSpans: PendingSpan[] = []

    dsl.value.rows.forEach((row) => {
      const occupiedCols = new Map<number, PendingSpan>()
      pendingSpans.forEach((span) => {
        for (let col = span.startCol; col < span.startCol + span.colspan; col++) {
          occupiedCols.set(col, span)
        }
      })

      const cells: PositionedCell[] = []
      const nextPendingSpans: PendingSpan[] = []
      let currentCol = 0

      row.cells.forEach((cell, cellIndex) => {
        while (occupiedCols.has(currentCol)) {
          currentCol++
        }

        const startCol = currentCol
        const endCol = startCol + cell.colspan - 1

        cells.push({
          cell,
          cellIndex,
          startCol,
          endCol,
        })

        if (cell.rowspan > 1) {
          nextPendingSpans.push({
            cell,
            startCol,
            colspan: cell.colspan,
            remainingRows: cell.rowspan - 1,
          })
        }

        currentCol = endCol + 1
      })

      layouts.push({ cells, occupiedCols })

      pendingSpans = pendingSpans
        .filter((span) => span.remainingRows > 1)
        .map((span) => ({
          ...span,
          remainingRows: span.remainingRows - 1,
        }))

      pendingSpans.push(...nextPendingSpans)
    })

    return layouts
  })

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
      height: DEFAULT_ROW_HEIGHT,
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
    dsl.value.colWidths ??= []
    dsl.value.colWidths.splice(afterIndex + 1, 0, DEFAULT_COL_WIDTH)
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
    dsl.value.colWidths?.splice(colIndex, 1)
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
    const layouts = tableLayout.value
    pushHistory()
    const { startRow, startCol, endRow, endCol } = sel
    const rowspan = endRow - startRow + 1
    const colspan = endCol - startCol + 1

    for (let r = startRow; r <= endRow; r++) {
      const row = dsl.value.rows[r]
      const rowLayout = layouts[r]
      if (!row) continue
      if (!rowLayout) continue

      const cellsToRemove: number[] = []
      for (const positionedCell of rowLayout.cells) {
        if (positionedCell.startCol >= startCol && positionedCell.endCol <= endCol) {
          if (r === startRow && positionedCell.startCol === startCol) {
            positionedCell.cell.rowspan = rowspan
            positionedCell.cell.colspan = colspan
          } else {
            cellsToRemove.push(positionedCell.cellIndex)
          }
        }
      }

      const reversedToRemove = [...cellsToRemove].reverse()
      for (const idx of reversedToRemove) {
        row.cells.splice(idx, 1)
      }
    }

    selection.value = null
  }

  function splitCell(rowIndex: number, colIndex: number) {
    const layouts = tableLayout.value
    const currentRowLayout = layouts[rowIndex]
    const positionedCell = currentRowLayout?.cells.find(
      (item) => colIndex >= item.startCol && colIndex <= item.endCol,
    )

    if (!positionedCell) return

    const cell = positionedCell.cell
    if (cell.rowspan === 1 && cell.colspan === 1) return

    pushHistory()
    const savedRowspan = cell.rowspan
    const savedColspan = cell.colspan
    const startCol = positionedCell.startCol

    if (savedColspan > 1) {
      const row = dsl.value.rows[rowIndex]
      if (row) {
        for (let c = 1; c < savedColspan; c++) {
          row.cells.splice(positionedCell.cellIndex + c, 0, createDefaultCell())
        }
      }
    }

    if (savedRowspan > 1) {
      for (let r = 1; r < savedRowspan; r++) {
        const targetRow = dsl.value.rows[rowIndex + r]
        const targetLayout = layouts[rowIndex + r]
        if (targetRow && targetLayout) {
          const nextCell = targetLayout.cells.find((item) => item.startCol > startCol)
          const insertIndex = nextCell ? nextCell.cellIndex : targetRow.cells.length

          for (let c = 0; c < savedColspan; c++) {
            targetRow.cells.splice(insertIndex + c, 0, createDefaultCell())
          }
        }
      }
    }

    cell.rowspan = 1
    cell.colspan = 1
  }

  function getCellAt(rowIndex: number, colIndex: number): CellSchema | null {
    const rowLayout = tableLayout.value[rowIndex]
    if (!rowLayout) return null

    const directCell = rowLayout.cells.find(
      (cell) => colIndex >= cell.startCol && colIndex <= cell.endCol,
    )
    if (directCell) return directCell.cell

    return rowLayout.occupiedCols.get(colIndex)?.cell ?? null
  }

  function getCellIndexAt(rowIndex: number, colIndex: number): number {
    const rowLayout = tableLayout.value[rowIndex]
    if (!rowLayout) return -1

    return rowLayout.cells.find(
      (cell) => colIndex >= cell.startCol && colIndex <= cell.endCol,
    )?.cellIndex ?? -1
  }

  function getCellStartCol(rowIndex: number, cellIndex: number): number {
    const rowLayout = tableLayout.value[rowIndex]
    if (!rowLayout) return 0

    return rowLayout.cells.find((cell) => cell.cellIndex === cellIndex)?.startCol ?? 0
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
      dsl.value = normalizeDSL(parsed)
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
    getCellStartCol,
    getRenderRows,
    exportDSL,
    importDSL,
    reset,
  }
}
