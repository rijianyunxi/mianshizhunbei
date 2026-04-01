export type CellType = 'static' | 'master' | 'detail'

export type RowType = 'normal' | 'loop'

export type TextAlign = 'left' | 'center' | 'right'

export interface CellSchema {
  id: string
  type: CellType
  text: string
  fieldKey: string
  rowspan: number
  colspan: number
  textAlign: TextAlign
  width?: number
}

export interface RowSchema {
  id: string
  type: RowType
  loopKey?: string
  cells: CellSchema[]
}

export interface TableDSL {
  id: string
  name: string
  rows: RowSchema[]
  colCount: number
}

export interface FormData {
  [key: string]: any
}

export interface CellPosition {
  rowIndex: number
  colIndex: number
}

export interface CellSelection {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}
