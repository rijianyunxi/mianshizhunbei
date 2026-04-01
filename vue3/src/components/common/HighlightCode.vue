<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const props = defineProps<{
  code: string
  language?: string
}>()

const highlighted = ref('')
const copied = ref(false)

const highlight = () => {
  const lang = props.language || 'typescript'
  try {
    highlighted.value = hljs.highlight(props.code, { language: lang }).value
  } catch {
    highlighted.value = props.code
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.code
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => highlight())
watch(() => props.code, () => highlight())
</script>

<template>
  <div class="code-container">
    <button class="copy-btn" :class="{ copied }" @click="copyCode">
      <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {{ copied ? '已复制' : '复制' }}
    </button>
    <pre><code class="hljs" v-html="highlighted"></code></pre>
  </div>
</template>

<style scoped>
.code-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(40, 44, 52, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #abb2bf;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    opacity: 1;
    background: rgba(60, 65, 75, 0.95);
    color: #fff;
  }

  &.copied {
    opacity: 1;
    background: rgba(34, 197, 94, 0.25);
    border-color: rgba(34, 197, 94, 0.4);
    color: #4ade80;
  }
}

pre {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
}

code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre;
  font-weight: 500;
}
</style>
