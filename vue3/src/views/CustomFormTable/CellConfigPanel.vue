<script setup lang="ts">
import type { CellSchema, CellType, TextAlign } from './types'

defineProps<{
  cell: CellSchema | null
  rowIndex: number
  colIndex: number
  rowType: 'normal' | 'loop'
  loopKey: string
}>()

const emit = defineEmits<{
  update: [updates: Partial<CellSchema>]
  updateRowType: [type: 'normal' | 'loop']
  updateLoopKey: [key: string]
}>()

function updateCell(updates: Partial<CellSchema>) {
  emit('update', updates)
}

function handleTypeChange(type: CellType) {
  updateCell({ type })
}

function handleTextChange(text: string) {
  updateCell({ text })
}

function handleFieldKeyChange(fieldKey: string) {
  updateCell({ fieldKey })
}

function handleAlignChange(align: TextAlign) {
  updateCell({ textAlign: align })
}

function handleRowTypeChange(type: 'normal' | 'loop') {
  emit('updateRowType', type)
}

function handleLoopKeyChange(key: string) {
  emit('updateLoopKey', key)
}
</script>

<template>
  <div class="cell-config-panel">
    <div class="panel-header">
      <h3>单元格配置</h3>
      <span class="cell-position">行 {{ rowIndex + 1 }}, 列 {{ colIndex + 1 }}</span>
    </div>

    <div v-if="!cell" class="empty-state">
      请选择一个单元格进行配置
    </div>

    <template v-else>
      <div class="config-section">
        <h4>行设置</h4>
        <div class="form-item">
          <label>行类型</label>
          <select :value="rowType" @change="handleRowTypeChange(($event.target as HTMLSelectElement).value as 'normal' | 'loop')">
            <option value="normal">普通行</option>
            <option value="loop">循环行</option>
          </select>
        </div>
        <div v-if="rowType === 'loop'" class="form-item">
          <label>循环数据键</label>
          <input
            type="text"
            :value="loopKey"
            placeholder="如: purchase_list"
            @input="handleLoopKeyChange(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="config-section">
        <h4>单元格类型</h4>
        <div class="type-selector">
          <button
            :class="{ active: cell.type === 'static' }"
            @click="handleTypeChange('static')"
          >
            静态文本
          </button>
          <button
            :class="{ active: cell.type === 'master' }"
            @click="handleTypeChange('master')"
          >
            主表绑定
          </button>
          <button
            :class="{ active: cell.type === 'detail' }"
            @click="handleTypeChange('detail')"
          >
            明细绑定
          </button>
        </div>
      </div>

      <div class="config-section">
        <template v-if="cell.type === 'static'">
          <div class="form-item">
            <label>显示文本</label>
            <input
              type="text"
              :value="cell.text"
              placeholder="输入静态文本内容"
              @input="handleTextChange(($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>

        <template v-else>
          <div class="form-item">
            <label>字段键 (Field Key)</label>
            <input
              type="text"
              :value="cell.fieldKey"
              placeholder="如: order_name"
              @input="handleFieldKeyChange(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="form-item">
            <label>显示文本 (可选)</label>
            <input
              type="text"
              :value="cell.text"
              placeholder="占位提示文本"
              @input="handleTextChange(($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>
      </div>

      <div class="config-section">
        <h4>样式设置</h4>
        <div class="form-item">
          <label>对齐方式</label>
          <div class="align-selector">
            <button :class="{ active: cell.textAlign === 'left' }" @click="handleAlignChange('left')">左对齐</button>
            <button :class="{ active: cell.textAlign === 'center' }" @click="handleAlignChange('center')">居中</button>
            <button :class="{ active: cell.textAlign === 'right' }" @click="handleAlignChange('right')">右对齐</button>
          </div>
        </div>
        <div class="form-item">
          <label>合并状态</label>
          <span class="merge-info">
            跨 {{ cell.rowspan }} 行 × {{ cell.colspan }} 列
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.cell-config-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid #e4e7ed;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #303133;
  }

  .cell-position {
    font-size: 12px;
    color: #909399;
  }
}

.empty-state {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
  font-size: 14px;
}

.config-section {
  margin-bottom: 20px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #606266;
    font-weight: 500;
  }
}

.form-item {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }

  input,
  select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #409eff;
    }
  }
}

.type-selector {
  display: flex;
  gap: 4px;

  button {
    flex: 1;
    padding: 6px 8px;
    font-size: 12px;
    border: 1px solid #dcdfe6;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    color: #606266;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }

    &.active {
      background: #409eff;
      border-color: #409eff;
      color: #fff;
    }
  }
}

.align-selector {
  display: flex;
  gap: 4px;

  button {
    flex: 1;
    padding: 6px 4px;
    font-size: 11px;
    border: 1px solid #dcdfe6;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    color: #606266;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }

    &.active {
      background: #409eff;
      border-color: #409eff;
      color: #fff;
    }
  }
}

.merge-info {
  font-size: 13px;
  color: #606266;
}
</style>
