<script setup lang="ts">
import { ref } from 'vue'
import type { DirectiveBinding, ObjectDirective } from 'vue'
import HighlightCode from '@/components/common/HighlightCode.vue'

// 1. v-focus — 纯 mounted，无需清理
const vFocus: ObjectDirective = {
  mounted: (el: HTMLElement) => el.focus()
}

// 2. v-color — 纯 mounted，无需清理
const vColor: ObjectDirective = {
  mounted: (el: HTMLElement, binding: DirectiveBinding) => {
    el.style.color = binding.value
  }
}

// 3. v-permission — 纯 mounted，无需清理
const vPermission: ObjectDirective = {
  mounted: (el: HTMLElement, binding: DirectiveBinding) => {
    const role = 'user'
    if (binding.value && binding.value !== role) {
      el.style.display = 'none'
    }
  }
}

// 4. v-debounce — 绑定了 click，必须在 unmounted 中移除
const vDebounce: ObjectDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const handler = () => {
      if ((el as any)._debounceTimer) clearTimeout((el as any)._debounceTimer)
      ;(el as any)._debounceTimer = setTimeout(() => {
        binding.value()
      }, 1000)
    }
    ;(el as any)._debounceHandler = handler
    el.addEventListener('click', handler)
  },
  unmounted(el: HTMLElement) {
    if ((el as any)._debounceTimer) clearTimeout((el as any)._debounceTimer)
    el.removeEventListener('click', (el as any)._debounceHandler)
  }
}

// 5. v-lifecycle — 展示完整生命周期钩子
const lifecycleLog = ref<string[]>([])

const vLifecycle: ObjectDirective = {
  created(el, binding, vnode) {
    lifecycleLog.value.push('🟡 created — 指令绑定到元素前，仅能访问 binding / vnode')
  },
  beforeMount(el, binding, vnode) {
    lifecycleLog.value.push('🔵 beforeMount — 元素即将挂载到 DOM')
  },
  mounted(el, binding, vnode) {
    lifecycleLog.value.push('🟢 mounted — 元素已挂载到 DOM，可操作真实 DOM')
  },
  beforeUpdate(el, binding, vnode, prevVnode) {
    lifecycleLog.value.push('🟠 beforeUpdate — 组件更新前，vnode 即将变化')
  },
  updated(el, binding, vnode, prevVnode) {
    lifecycleLog.value.push('🔴 updated — 组件已更新，binding.value 可能已变化')
  },
  beforeUnmount(el, binding, vnode) {
    lifecycleLog.value.push('⚫ beforeUnmount — 元素即将从 DOM 移除')
  },
  unmounted(el, binding, vnode) {
    lifecycleLog.value.push('⚪ unmounted — 元素已移除，清理定时器 / 事件监听')
  }
}

const count = ref(0)
const handleClick = () => {
  count.value++
}

const focusInput = ref('')
const showLifecycle = ref(true)
const colorValue = ref('#3b82f6')

const expandedCard = ref<string | null>(null)

const toggleCode = (name: string) => {
  expandedCard.value = expandedCard.value === name ? null : name
}

const codeSnippets = {
  focus: `const vFocus = {\n  mounted: (el) => el.focus()\n}\n\n// 使用\n<input v-focus />`,
  color: `const vColor = {\n  mounted: (el, binding) => {\n    el.style.color = binding.value\n  }\n}\n\n// 使用\n<span v-color="'#409eff'">Primary</span>`,
  permission: `const vPermission = {\n  mounted: (el, binding) => {\n    const role = 'user'\n    if (binding.value !== role) {\n      el.style.display = 'none'\n    }\n  }\n}\n\n// 使用\n<button v-permission="'admin'">删除</button>`,
  debounce: `const vDebounce = {\n  mounted(el, binding) {\n    const handler = () => {\n      clearTimeout(el._timer)\n      el._timer = setTimeout(binding.value, 1000)\n    }\n    el._handler = handler\n    el.addEventListener('click', handler)\n  },\n  unmounted(el) {\n    clearTimeout(el._timer)\n    el.removeEventListener('click', el._handler)\n  }\n}`,
  lifecycle: `const vLifecycle = {\n  created() { console.log('created') },\n  beforeMount() { console.log('beforeMount') },\n  mounted() { console.log('mounted') },\n  beforeUpdate() { console.log('beforeUpdate') },\n  updated() { console.log('updated') },\n  beforeUnmount() { console.log('beforeUnmount') },\n  unmounted() { console.log('unmounted') }\n}`
}
</script>

<template>
  <div class="demo-page">
    <header class="page-header">
      <h1>自定义指令</h1>
      <p>Vue 自定义指令的常见使用场景与完整生命周期</p>
    </header>

    <div class="grid">
      <!-- v-focus -->
      <div class="card">
        <div class="card-header">
          <span class="badge blue">DOM 操作</span>
          <code class="tag">v-focus</code>
        </div>
        <p class="desc">元素挂载后自动获得焦点，适用于搜索框、表单首项等场景。</p>
        <div class="preview">
          <input v-focus v-model="focusInput" type="text" placeholder="自动聚焦输入框..." />
        </div>
        <div class="card-footer">
          <button class="toggle-btn" @click="toggleCode('focus')">
            {{ expandedCard === 'focus' ? '收起代码' : '查看实现' }}
            <svg class="arrow" :class="{ open: expandedCard === 'focus' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-show="expandedCard === 'focus'" class="code-block">
            <HighlightCode :code="codeSnippets.focus" />
          </div>
        </div>
      </div>

      <!-- v-color -->
      <div class="card">
        <div class="card-header">
          <span class="badge green">样式控制</span>
          <code class="tag">v-color</code>
        </div>
        <p class="desc">通过指令动态设置文字颜色，支持传递任意颜色值。</p>
        <div class="preview colors-preview">
          <span v-color="colorValue">动态颜色文字</span>
          <div class="color-picks">
            <span
              v-for="c in ['#f56c6c', '#e6a23c', '#409eff', '#67c23a']"
              :key="c"
              class="color-dot"
              :class="{ active: colorValue === c }"
              :style="{ background: c }"
              @click="colorValue = c"
            />
          </div>
        </div>
        <div class="card-footer">
          <button class="toggle-btn" @click="toggleCode('color')">
            {{ expandedCard === 'color' ? '收起代码' : '查看实现' }}
            <svg class="arrow" :class="{ open: expandedCard === 'color' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-show="expandedCard === 'color'" class="code-block">
            <HighlightCode :code="codeSnippets.color" />
          </div>
        </div>
      </div>

      <!-- v-permission -->
      <div class="card">
        <div class="card-header">
          <span class="badge orange">权限控制</span>
          <code class="tag">v-permission</code>
        </div>
        <p class="desc">根据用户角色控制元素显隐，常用于按钮级权限管理。</p>
        <div class="preview">
          <div class="role-info">
            当前角色：<span class="role-badge">user</span>
          </div>
          <div class="btn-group">
            <button v-permission="'admin'" class="btn danger">
              删除数据（管理员）
            </button>
            <button v-permission="'user'" class="btn">
              查看数据（普通用户）
            </button>
          </div>
        </div>
        <div class="card-footer">
          <button class="toggle-btn" @click="toggleCode('permission')">
            {{ expandedCard === 'permission' ? '收起代码' : '查看实现' }}
            <svg class="arrow" :class="{ open: expandedCard === 'permission' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-show="expandedCard === 'permission'" class="code-block">
            <pre><code>{{ codeSnippets.permission }}</code></pre>
          </div>
        </div>
      </div>

      <!-- v-debounce -->
      <div class="card">
        <div class="card-header">
          <span class="badge purple">事件处理</span>
          <code class="tag">v-debounce</code>
        </div>
        <p class="desc">
          按钮点击防抖，1 秒内重复点击只执行一次。
          <strong class="warn">⚠️ 添加了 addEventListener 必须在 unmounted 中 removeEventListener</strong>
        </p>
        <div class="preview">
          <button v-debounce="handleClick" class="btn primary">
            点击提交
          </button>
          <span class="count-badge">触发 {{ count }} 次</span>
        </div>
        <div class="card-footer">
          <button class="toggle-btn" @click="toggleCode('debounce')">
            {{ expandedCard === 'debounce' ? '收起代码' : '查看实现' }}
            <svg class="arrow" :class="{ open: expandedCard === 'debounce' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-show="expandedCard === 'debounce'" class="code-block">
            <pre><code>{{ codeSnippets.debounce }}</code></pre>
          </div>
        </div>
      </div>

      <!-- v-lifecycle 完整生命周期 -->
      <div class="card full-width">
        <div class="card-header">
          <span class="badge cyan">完整生命周期</span>
          <code class="tag">v-lifecycle</code>
        </div>
        <p class="desc">
          展示自定义指令的 7 个生命周期钩子。点击"切换显隐"触发 beforeUpdate / updated / beforeUnmount / unmounted。
        </p>
        <div class="preview lifecycle-preview">
          <button class="btn primary" @click="showLifecycle = !showLifecycle">
            {{ showLifecycle ? '隐藏元素 (触发 unmount)' : '显示元素 (触发 mount)' }}
          </button>
          <div v-if="showLifecycle" v-lifecycle class="lifecycle-target">
            指令已挂载
          </div>
          <div class="log-box">
            <div
              v-for="(log, i) in lifecycleLog"
              :key="i"
              class="log-item"
            >
              {{ log }}
            </div>
            <div v-if="!lifecycleLog.length" class="log-empty">
              等待生命周期触发...
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button class="toggle-btn" @click="toggleCode('lifecycle')">
            {{ expandedCard === 'lifecycle' ? '收起代码' : '查看实现' }}
            <svg class="arrow" :class="{ open: expandedCard === 'lifecycle' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-show="expandedCard === 'lifecycle'" class="code-block">
            <pre><code>{{ codeSnippets.lifecycle }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.demo-page {
  width: 100%;
}

.page-header {
  margin-bottom: 32px;

  h1 {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 15px;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  align-items: start;
}

.card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  padding-bottom: 20px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &.full-width {
    grid-column: 1 / -1;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 0;
}

.badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;

  &.blue { background: #eff6ff; color: #3b82f6; }
  &.green { background: #f0fdf4; color: #22c55e; }
  &.orange { background: #fff7ed; color: #f97316; }
  &.purple { background: #faf5ff; color: #a855f7; }
  &.cyan { background: #ecfeff; color: #06b6d4; }
}

.tag {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
}

.desc {
  padding: 8px 20px 0;
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.warn {
  color: #f59e0b;
  font-weight: 500;
}

.preview {
  padding: 20px;
  margin: 16px 20px 0;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.colors-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 600;
  font-size: 15px;
}

.color-picks {
  display: flex;
  gap: 8px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;

  &.active {
    border-color: #0f172a;
    transform: scale(1.15);
  }
}

.role-info {
  margin-bottom: 12px;
  font-size: 13px;
  color: #64748b;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fef3c7;
  color: #d97706;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.btn-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 9px 18px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  &.primary {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;

    &:hover {
      background: #2563eb;
    }
  }

  &.danger {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fecaca;

    &:hover {
      background: #fee2e2;
    }
  }
}

.count-badge {
  display: inline-block;
  margin-left: 12px;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.lifecycle-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lifecycle-target {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #ecfdf5;
  border: 1.5px solid #6ee7b7;
  border-radius: 8px;
  color: #065f46;
  font-weight: 600;
  font-size: 14px;
}

.log-box {
  max-height: 160px;
  overflow-y: auto;
  background: #f6f8fa;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.8;
}

.log-item {
  color: #334155;
}

.log-empty {
  color: #94a3b8;
  text-align: center;
}

.card-footer {
  padding: 0 20px;
  margin-top: 16px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #334155;
  }
}

.arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;

  &.open {
    transform: rotate(180deg);
  }
}

.code-block {
  margin: 12px 20px 20px;
  border-radius: 8px;
  overflow-x: auto;

  :deep(pre) {
    margin: 0;
    padding: 16px;
    background: #f6f8fa;
    border-radius: 8px;
  }

  :deep(code) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre;
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
