import type { TableDSL, FormData } from '../types'

export function resolveCellValue(cell: TableDSL['rows'][number]['cells'][number], data: FormData, loopItem?: Record<string, any>): string {
  if (cell.type === 'static') {
    return cell.text
  }
  if (cell.type === 'master') {
    return data[cell.fieldKey] ?? ''
  }
  if (cell.type === 'detail' && loopItem) {
    return loopItem[cell.fieldKey] ?? ''
  }
  return ''
}

export function collectFormData(dsl: TableDSL): FormData {
  const data: FormData = {}
  for (const row of dsl.rows) {
    for (const cell of row.cells) {
      if (cell.type === 'master' && cell.fieldKey) {
        if (!(cell.fieldKey in data)) {
          data[cell.fieldKey] = ''
        }
      }
      if (row.type === 'loop' && row.loopKey && cell.type === 'detail' && cell.fieldKey) {
        if (!(row.loopKey in data)) {
          data[row.loopKey] = []
        }
      }
    }
  }
  return data
}
