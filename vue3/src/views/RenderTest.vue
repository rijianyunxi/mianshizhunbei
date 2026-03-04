<script setup>
import { ref, onMounted } from 'vue';

// 屏幕上实际渲染的数据
const list = ref([]); 

// 模拟从后端获取的 10,000 条总数据（不在 ref 中，避免响应式开销）
let allData = []; 

// 记录当前已经渲染到哪一条了
let currentIndex = 0; 
// 每次浏览器空闲时，最多渲染多少条（可根据 DOM 复杂度调整）
const CHUNK_SIZE = 20; 

// 1. 生成总数据
const generateData = () => {
  for (let i = 0; i < 10000; i++) {
    allData.push({
      id: i,
      name: `用户_${i + 1}`,
      role: i % 2 === 0 ? '管理员' : '普通用户',
      updateTime: new Date().toLocaleTimeString(),
      // 【修复 Bug】为每个用户分配独立的数据源，防止 input 输入联动
      inputValue: '' 
    });
  }
};

const renderChunk = () => {
  if (currentIndex < allData.length) {
    // 1. 每次只截取一个小分片
    const chunk = allData.slice(currentIndex, currentIndex + CHUNK_SIZE);
    
    // 2. 触发 Vue 的响应式收集
    list.value.push(...chunk);
    currentIndex += CHUNK_SIZE;

    // 3. 【核心改变】绝对不使用 while 循环贪婪推送！
    // push 完立刻结束当前函数，把控制权交还给浏览器。
    // 此时浏览器会去执行 Vue 的 flushJobs -> 计算 DOM -> Paint 渲染屏幕

    // 4. 预约下一次空闲时间继续推入剩下的数据
    window.requestIdleCallback(renderChunk);
  } else {
    console.log('数据分片渲染完毕！');
  }
};

onMounted(() => {
  generateData(); // 先在内存里准备好 10,000 条数据
  
  // 兼容性处理：因为 Safari 浏览器不支持 requestIdleCallback
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(renderChunk);
  } else {
    // 降级方案：使用 setTimeout 模拟分片
    setTimeout(() => {
      list.value = allData;
    }, 0);
  }
});
</script>

<template>
  <div>
    <h2>时间切片渲染测试 (当前渲染数: {{ list.length }})</h2>
    
    <div class="list-container">
      <div v-for="item in list" :key="item.id" class="user-item">
        <input type="text" v-model="item.inputValue" placeholder="输入用户名">
        
        <div class="avatar">{{ item.id }}</div>
        
        <div class="info">
          <div class="name">{{ item.name }}</div>
          <div class="role">{{ item.role }}</div>
          <div class="update-time">{{ item.updateTime }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-container {
    width:600px;
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border-bottom: 1px solid #eee;
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
  font-size: 12px;
}
.info {
  display: flex;
  gap: 15px;
  color: #333;
}
</style>