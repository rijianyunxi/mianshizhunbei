export default `<script setup>
import { ref, onMounted, computed, useTemplateRef, onUnmounted, shallowRef } from 'vue'

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
let ticking = false

const totalHeight = computed(() => list.value.length * itemHeight)

const visibleData = computed(() => {
  const start = Math.max(0, startIndex.value - bufferSize)
  const end = Math.min(list.value.length, startIndex.value + Math.ceil(containerHeight.value / itemHeight) + bufferSize)
  return list.value.slice(start, end)
})

const onScroll = () => {
  if (!container.value || ticking) return
  ticking = true
  requestAnimationFrame(() => {
    currentScrollTop = container.value.scrollTop
    startIndex.value = Math.floor(currentScrollTop / itemHeight)
    offsetY.value = startIndex.value * itemHeight
    ticking = false
  })
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

onMounted(() => {
  // generateData()
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
<\/script>`
