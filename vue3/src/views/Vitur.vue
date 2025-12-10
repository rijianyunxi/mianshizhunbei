<template>
  <div class="monitor-container">
    <div class="header">
      无限循环监控 (Buffer: {{ bufferQueue.length }}, Total: {{ allData.length }})
    </div>
    
    <div 
      class="scroll-box" 
      ref="containerRef"
      @scroll.passive="handleScroll"
      @mouseenter="pauseScroll"
      @mouseleave="resumeScroll"
    >
      <div class="phantom" :style="{ height: totalHeight + 'px' }"></div>
      
      <div class="render-list" :style="{ transform: `translate3d(0, ${offset}px, 0)` }">
        <div 
          v-for="(item, index) in visibleData" 
          :key="item.uniqueKey" 
          class="item"
          :style="{ height: itemHeight + 'px' }"
          :class="{ 'new-item': item.isNew }" 
        >
          <span class="id">{{ item.id }}</span>
          <span class="content">{{ item.content }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, shallowRef, triggerRef } from 'vue';

// --- 配置项 ---
const boxHeight = 500;
const itemHeight = 50;
const bufferCount = 5; 
const scrollSpeed = 1; // 自动滚动速度

// --- 状态 ---
const allData = shallowRef([]); // 使用 shallowRef 优化性能
const bufferQueue = []; // WS 消息队列
const containerRef = ref(null);
const scrollTop = ref(0);

// --- 1. 虚拟滚动 + 无缝循环核心逻辑 ---

// 真实数据的总高度
const realDataHeight = computed(() => allData.value.length * itemHeight);

// 幽灵高度：真实高度 + 额外一屏(用于平滑过渡)
const totalHeight = computed(() => realDataHeight.value + boxHeight);

// 计算可见数据
const visibleData = computed(() => {
  const len = allData.value.length;
  if (len === 0) return [];

  // 当前滚到了第几个
  const startIdx = Math.floor(scrollTop.value / itemHeight);
  
  // 我们多渲染一些数据，保证视口填满
  // 视口能放下 10 个，我们渲染 20 个
  const visibleCount = Math.ceil(boxHeight / itemHeight) + bufferCount;
  
  const result = [];
  for (let i = 0; i < visibleCount; i++) {
    // 核心算法：取模！实现无限循环的数据索引
    // 如果 startIdx + i 超过了 len，它会自动变回 0, 1, 2...
    const realIndex = (startIdx + i) % len;
    
    const item = allData.value[realIndex];
    if (item) {
      // ⚠️ 重要：虚拟列表循环时，key 不能只用 item.id
      // 因为同一个 item.id 可能同时出现在列表的顶部和底部（首尾相接时）
      // 我们加一个后缀来区分是“原本的”还是“克隆出来的”
      result.push({
        ...item,
        uniqueKey: `${item.id}_${startIdx + i}` 
      });
    }
  }
  return result;
});

const offset = computed(() => {
  // 偏移量也需要特殊处理，让它看起来一直在往下滚
  const startIdx = Math.floor(scrollTop.value / itemHeight);
  return startIdx * itemHeight;
});

// --- 2. 滚动处理与“瞬间回弹” ---
const handleScroll = (e) => {
  const currentScroll = e.target.scrollTop;
  scrollTop.value = currentScroll;
  
  // 【核心魔法】触底回弹
  // 当滚动的距离 >= 真实数据的高度时
  // 意味着我们已经把所有数据滚了一遍，并且正好滚到了“克隆层”的开头
  if (currentScroll >= realDataHeight.value) {
    // 1. 瞬间把滚动条拉回 0
    // 因为第 0 条数据 和 第 N+1 条数据长得一模一样，肉眼看不出变化
    const overflow = currentScroll - realDataHeight.value;
    // 减去溢出量，保持极其精确的平滑，防止抖动
    e.target.scrollTop = overflow; 
    scrollTop.value = overflow;
    
    // 2. 【这里是触发数据更新的最佳时机！】
    // 就像你说的：既然反正都回到起点了，这时候悄悄改数据，用户最不敏感
    processBufferQueue();
  }
};

// --- 3. WebSocket 数据处理 (Buffer 机制) ---

// 外部调用：接收 WS 数据
const onWebSocketMessage = (newItems) => {
  // 先把数据冻结，存入暂存区，不直接渲染
  const frozenItems = newItems.map(item => Object.freeze(item));
  bufferQueue.push(...frozenItems);
};

// 执行数据合并（只在回弹瞬间，或者数据量很少时执行）
const processBufferQueue = () => {
  if (bufferQueue.length === 0) return;

  console.log('⚡️ 循环周期结束，执行数据合并，新增条数：', bufferQueue.length);

  // 1. 加数据
  allData.value.push(...bufferQueue);
  
  // 2. 限制最大长度 (比如 2000)，保持内存健康
  if (allData.value.length > 2000) {
    // 删掉头部多余的 (注意：splice 会改变数组，影响当前索引，但在回弹瞬间是安全的)
    // 稍微复杂的点：如果在非回弹时刻删，需要调整 scrollTop，但在回弹时刻 scrollTop 刚好是 0
    allData.value.splice(0, allData.value.length - 2000);
  }
  
  // 3. 清空队列
  bufferQueue.length = 0;
  
  // 4. 通知 Vue 更新
  triggerRef(allData);
};

// --- 4. 自动滚动引擎 ---
let isPaused = false;
let animationFrameId = null;

const startAutoScroll = () => {
  const step = () => {
    if (!isPaused && containerRef.value) {
      containerRef.value.scrollTop += scrollSpeed;
      // 注意：这里不需要手动判断回弹，scroll 事件里的 handleScroll 会自动处理
    }
    animationFrameId = requestAnimationFrame(step);
  };
  step();
};

const pauseScroll = () => { isPaused = true; };
const resumeScroll = () => { isPaused = false; };

// --- 初始化模拟 ---
onMounted(() => {
  // 初始数据
  const initialData = Array.from({ length: 20 }, (_, i) => ({ id: i, content: `Initial Data ${i}` }));
  allData.value = initialData;
  
  startAutoScroll();

  // 模拟 WS 推送
  setInterval(() => {
    onWebSocketMessage([{ id: Date.now(), content: `New Msg ${Date.now()}`, isNew: true }]);
  }, 500);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.monitor-container { background: #111; color: #fff; width: 400px; margin: 20px auto; }
.scroll-box { height: 500px; overflow-y: scroll; position: relative; scrollbar-width: none; }
.scroll-box::-webkit-scrollbar { display: none; } /* 隐藏滚动条好看点 */
.phantom { width: 100%; position: absolute; z-index: -1; }
.render-list { position: absolute; width: 100%; top: 0; left: 0; }
.item { height: 50px; border-bottom: 1px solid #333; display: flex; align-items: center; padding: 0 10px; box-sizing: border-box;}
.id { color: cyan; width: 100px; }
.new-item { color: #5eff00; transition: color 1s; } /* 新数据高亮一下 */
</style>