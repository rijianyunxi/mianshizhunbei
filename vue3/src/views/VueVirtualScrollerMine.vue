<script setup>
import { ref, onMounted, computed, useTemplateRef, onUnmounted } from 'vue';

const list = ref([]);
const container = useTemplateRef('container');

// ====== 虚拟滚动 & 性能优化核心配置 ======
const itemHeight = 60; // 每一项的固定高度
const containerHeight = 600; // 容器固定高度
// 可视区能展示的项数，加 2 是为了上下缓冲，防止快速滚动时出现白屏
const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; 

const startIndex = ref(0); // 当前可视区的起始索引
const offsetY = ref(0); // 渲染区域的 Y 轴偏移量

// 【性能优化】使用普通 JS 变量代替响应式变量来控制动画，避免触发多余的 Vue 视图更新
let currentScrollTop = 0; 
let cachedClientHeight = 0; // 缓存容器高度，避免在 requestAnimationFrame 中不断触发 DOM Read
let animationId = null; 

// 1. 计算总高度（用这个高度去撑开原生的滚动条）
const totalHeight = computed(() => list.value.length * itemHeight);

// 2. 计算当前应该被渲染的数据（核心：只截取视口内的十几条数据进行渲染）
const visibleData = computed(() => {
  const start = startIndex.value;
  const end = Math.min(list.value.length, start + visibleCount);
  return list.value.slice(start, end);
});

// 3. 监听真实的滚动事件（用户手动滚动 + 自动滚动 都会触发这里）
const onScroll = () => {
  if (!container.value) return;
  const realScrollTop = container.value.scrollTop;
  
  // 【性能优化】同步用户的真实滚动位置给我们的 JS 变量，防止自动滚动和手动滚动发生冲突跳跃
  currentScrollTop = realScrollTop; 

  // 算出当前滚到了第几个 item
  startIndex.value = Math.floor(realScrollTop / itemHeight);
  // 真实 DOM 区域往下移动，让它始终呆在视口里
  offsetY.value = startIndex.value * itemHeight;
};

// ====== 自动/手动混合控制逻辑 ======
const startAutoScroll = () => {
  const scrollStep = () => {
    if (!container.value) return;
    
    // 【性能优化 - DOM Write 阶段】
    // 操作纯 JS 变量，没有 DOM Read 操作
    currentScrollTop += 1; // 控制滚动速度，数字越大滚得越快

    // 读取缓存的 clientHeight 进行边界判断，实现触底循环
    if (currentScrollTop >= totalHeight.value - cachedClientHeight) {
      currentScrollTop = 0;
    }
    
    // 仅仅进行单纯的 DOM 赋值写入（Write-only），浏览器会将其合并优化
    container.value.scrollTop = currentScrollTop; 

    // 递归请求下一帧
    animationId = requestAnimationFrame(scrollStep);
  };
  
  animationId = requestAnimationFrame(scrollStep);
};

const onMouseEnter = () => {
  // 鼠标进入，杀掉动画帧，此时原生滚动条完全交由用户鼠标滚轮接管
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

const onMouseleave = () => {
  // 鼠标离开，基于当前的 currentScrollTop 恢复自动滚动
  startAutoScroll();
};

// ====== 数据初始化 ======
const generateData = () => {
  const items = [];
  // 哪怕这里是 100,000 条，DOM 里也永远只有十几个节点
  for (let i = 0; i < 100; i++) {
    items.push({
      id: i,
      name: `用户_${i + 1}`,
      role: i % 2 === 0 ? '管理员' : '普通用户',
      updateTime: new Date().toLocaleTimeString()
    });
  }
  list.value = items;
};

onMounted(() => {
  generateData();
  
  // 【性能优化】组件挂载后，只读取一次 DOM 高度并缓存起来
  if (container.value) {
    cachedClientHeight = container.value.clientHeight; 
  }
  
  startAutoScroll(); 
});

onUnmounted(() => {
  // 离开页面时务必销毁 rAF，防止内存泄漏和后台无效执行
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <div 
    class="container" 
    ref="container" 
    @scroll="onScroll" 
    @mouseenter="onMouseEnter" 
    @mouseleave="onMouseleave"
  >
    <div class="phantom-box" :style="{ height: totalHeight + 'px' }"></div>
    
    <div class="render-box" :style="{ transform: `translateY(${offsetY}px)` }">
      <div v-for="item in visibleData" :key="item.id" class="user-item">
        <div class="avatar">{{ item.id }}</div>
        <div class="info">
          <p class="name">{{ item.name }} - <span class="tag">{{ item.role }}</span></p>
          <p class="time">最后更新: {{ item.updateTime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  height: 600px;
  margin: 20px auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow-y: auto;
  /* 核心：必须是相对定位，因为里面的 render-box 要绝对定位跟着跑 */
  position: relative; 
  /* 平滑滚动的核心，如果需要隐藏滚动条可以加上下面这行 */
  /* scrollbar-width: none; */ 
}

/* 核心：绝对定位，并且宽度撑满 */
.render-box {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.user-item {
  display: flex;
  align-items: center;
  /* 必须与 JS 中的 itemHeight 严格对应 */
  height: 60px; 
  padding: 0 15px;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  /* 必须给个纯色背景，否则在滚动时由于元素的 translateY 位移，会透视看到背后的重影 */
  background-color: #fff; 
}

.avatar {
  width: 40px;
  height: 40px;
  background: #42b883;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 12px;
}

.name {
  margin: 0;
  font-weight: bold;
}

.tag {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

.time {
  margin: 0;
  font-size: 12px;
  color: #999;
}
</style>