<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from './types'
import type { TableDSL, FormData } from './types'
import { resolveCellValue } from './composables/useDataBinding'

const props = defineProps<{
  dsl: TableDSL
  formData?: FormData
}>()

function getLoopData(row: TableDSL['rows'][number]): Array<Record<string, any>> {
  if (row.type !== 'loop' || !row.loopKey) return []
  const data = props.formData?.[row.loopKey]
  return Array.isArray(data) ? data : []
}

function getCellContent(cell: TableDSL['rows'][number]['cells'][number], loopItem?: Record<string, any>): string {
  return resolveCellValue(cell, props.formData ?? {}, loopItem) || '\u00A0'
}

const tableMinWidth = computed(() => {
  const widths = props.dsl.colWidths ?? []
  const totalWidth = widths.length > 0
    ? widths.reduce((sum, width) => sum + width, 0)
    : props.dsl.colCount * DEFAULT_COL_WIDTH

  return `${totalWidth}px`
})

function getColWidth(colIndex: number): number {
  return props.dsl.colWidths?.[colIndex] ?? DEFAULT_COL_WIDTH
}

function getRowHeight(rowIndex: number): number {
  return props.dsl.rows[rowIndex]?.height ?? DEFAULT_ROW_HEIGHT
}

function getCellHeight(rowIndex: number, rowspan: number): number {
  let totalHeight = 0

  for (let offset = 0; offset < rowspan; offset++) {
    totalHeight += getRowHeight(rowIndex + offset)
  }

  return totalHeight
}
</script>

<template>
  <table class="custom-form-table" :style="{ minWidth: tableMinWidth }">
    <colgroup>
      <col
        v-for="(_, colIndex) in dsl.colCount"
        :key="colIndex"
        :style="{ width: `${getColWidth(colIndex)}px` }"
      >
    </colgroup>
    <template v-for="(row, rowIndex) in dsl.rows" :key="row.id">
      <template v-if="row.type === 'loop'">
        <tr
          v-for="(item, idx) in getLoopData(row)"
          :key="`${row.id}_${idx}`"
          class="loop-row"
        >
          <td
            v-for="cell in row.cells"
            :key="`${cell.id}_${idx}`"
            :rowspan="cell.rowspan"
            :colspan="cell.colspan"
            :style="{ textAlign: cell.textAlign }"
            class="table-cell"
          >
            <div
              class="table-cell-inner"
              :style="{ minHeight: `${getCellHeight(rowIndex, cell.rowspan)}px` }"
            >
              {{ getCellContent(cell, item) }}
            </div>
          </td>
        </tr>
      </template>
      <tr v-else :key="row.id" class="normal-row">
        <td
          v-for="cell in row.cells"
          :key="cell.id"
          :rowspan="cell.rowspan"
          :colspan="cell.colspan"
          :style="{ textAlign: cell.textAlign }"
          class="table-cell"
        >
          <div
            class="table-cell-inner"
            :style="{ minHeight: `${getCellHeight(rowIndex, cell.rowspan)}px` }"
          >
            {{ getCellContent(cell) }}
          </div>
        </td>
      </tr>
    </template>
  </table>
</template>

<style scoped lang="scss">
.custom-form-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  .table-cell {
    border: 1px solid #dcdfe6;
    padding: 0;
    word-break: break-all;
    font-size: 14px;
    color: #303133;
    vertical-align: middle;
  }

  .table-cell-inner {
    min-height: 40px;
    padding: 12px 16px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }

  .loop-row {
    .table-cell {
      background-color: #fafafa;
    }
  }
}
</style>
