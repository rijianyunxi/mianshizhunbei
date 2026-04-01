<script setup>
import { ref, onMounted, computed, useTemplateRef, onUnmounted, shallowRef } from 'vue'
import HighlightCode from '@/components/common/HighlightCode.vue'
import sourceCode from './sourceCode'

const showCode = ref(true)
const list = shallowRef([])
const container = useTemplateRef('container')

const itemHeight = 60
const containerHeight = ref(600)
const bufferSize = 5
const visibleCount = computed(() => Math.ceil(containerHeight.value / itemHeight) + bufferSize * 2)

const startIndex = ref(0)
const offsetY = ref(0)

let currentScrollTop = 0
let cachedClientHeight = 0
let animationId = null

const totalHeight = computed(() => list.value.length * itemHeight)

const renderStartIndex = computed(() => Math.max(0, startIndex.value - bufferSize))

const visibleData = computed(() => {
  const start = renderStartIndex.value
  const end = Math.min(list.value.length, startIndex.value + Math.ceil(containerHeight.value / itemHeight) + bufferSize)
  return list.value.slice(start, end)
})

const offset = computed(() => renderStartIndex.value * itemHeight)

const onScroll = () => {
  if (!container.value) return
  currentScrollTop = container.value.scrollTop
  const newStartIndex = Math.floor(currentScrollTop / itemHeight)
  if (startIndex.value !== newStartIndex) {
    startIndex.value = newStartIndex
  }
}

const startAutoScroll = () => {
  const scrollStep = () => {
    if (!container.value) return
    currentScrollTop += 1
    if (currentScrollTop >= totalHeight.value - cachedClientHeight) {
      currentScrollTop = 0
    }
    container.value.scrollTop = currentScrollTop
    animationId = requestAnimationFrame(scrollStep)
  }
  animationId = requestAnimationFrame(scrollStep)
}

const onMouseEnter = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

const onMouseleave = () => {
  startAutoScroll()
}

const generateData = () => {
  const items = []
  for (let i = 0; i < 100; i++) {
    items.push({
      id: i,
      name: `用户_${i + 1}`,
      role: i % 2 === 0 ? '管理员' : '普通用户',
      updateTime: new Date().toLocaleTimeString()
    })
  }
  list.value = items
}

onMounted(() => {
  generateData()
  if (container.value) {
    cachedClientHeight = container.value.clientHeight
    containerHeight.value = cachedClientHeight
  }
  startAutoScroll()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div class="vitur-page">
    <header class="page-header">
      <div>
        <h1>虚拟滚动</h1>
        <p>shallowRef + bufferSize + rAF 节流 + GPU 加速</p>
      </div>
      <button class="code-toggle" @click="showCode = !showCode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
        </svg>
        {{ showCode ? '隐藏代码' : '查看源码' }}
      </button>
    </header>

    <div class="content-wrap" :class="{ 'show-code': showCode }">
      <div class="preview-panel">
        <div class="scroll-container" ref="container" @scroll="onScroll" @mouseenter="onMouseEnter" @mouseleave="onMouseleave">
          <div class="phantom-box" :style="{ height: totalHeight + 'px' }"></div>
          <div class="render-box" :style="{ transform: `translate3d(0, ${offsetY}px, 0)` }">
            <div v-for="item in visibleData" :key="item.id" class="user-item">
              <div class="avatar">{{ item.id < 10 ? '0' + item.id : item.id }}</div>
              <div class="info">
                <p class="name">{{ item.name }} <span class="tag">{{ item.role }}</span></p>
                <p class="time">最后更新: {{ item.updateTime }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <transition name="slide-code">
        <div v-if="showCode" class="code-panel">
          <div class="code-scroll">
            <HighlightCode :code="sourceCode" language="javascript" />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.vitur-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;

  h1 {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }
}

.code-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }
}

.content-wrap {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;

  &.show-code {
    .preview-panel {
      width: 50%;
    }
  }
}

.preview-panel {
  width: 100%;
  min-width: 0;
  transition: width 0.3s ease;
}

.code-panel {
  width: 50%;
  flex-shrink: 0;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.code-scroll {
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  :deep(pre) {
    margin: 0;
    padding: 20px;
    background: #f6f8fa;
  }
}

.slide-code-enter-active,
.slide-code-leave-active {
  transition: all 0.3s ease;
}

.slide-code-enter-from,
.slide-code-leave-to {
  opacity: 0;
  width: 0;
}

.scroll-container {
  height: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-y: auto;
  position: relative;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 3px;

    &:hover {
      background: #cbd5e1;
    }
  }
}

.phantom-box {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

.render-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  will-change: transform;
}

.user-item {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  border-bottom: 1px solid #f1f5f9;
  box-sizing: border-box;
  background: #fff;
  transition: background 0.15s;

  &:hover {
    background: #f8fafc;
  }
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.tag {
  display: inline-block;
  padding: 1px 8px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 8px;
}

.time {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}
</style>
