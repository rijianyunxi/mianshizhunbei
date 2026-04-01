<script setup lang="ts">
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
</script>

<template>
  <table class="custom-form-table">
    <template v-for="row in dsl.rows" :key="row.id">
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
            :style="{ textAlign: cell.textAlign, height: cell.rowspan > 1 ? `${cell.rowspan * 48}px` : undefined }"
            class="table-cell"
          >
            {{ resolveCellValue(cell, formData ?? {}, item) }}
          </td>
        </tr>
      </template>
      <tr v-else :key="row.id" class="normal-row">
        <td
          v-for="cell in row.cells"
          :key="cell.id"
          :rowspan="cell.rowspan"
          :colspan="cell.colspan"
          :style="{ textAlign: cell.textAlign, height: cell.rowspan > 1 ? `${cell.rowspan * 48}px` : undefined }"
          class="table-cell"
        >
          {{ resolveCellValue(cell, formData ?? {}) }}
        </td>
      </tr>
    </template>
  </table>
</template>

<style scoped lang="scss">
.custom-form-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  tr {
    min-height: 44px;
  }

  .table-cell {
    border: 1px solid #dcdfe6;
    padding: 12px 16px;
    min-height: 48px;
    word-break: break-all;
    font-size: 14px;
    color: #303133;
    vertical-align: middle;
  }

  .loop-row {
    .table-cell {
      background-color: #fafafa;
    }
  }
}
</style>
