<template>
  <div class="error-container">
    <div class="content">
      <img src="https://illustrations.popsy.co/amber/surr-page-not-found.svg" alt="404" class="error-img" />
      
      <h1 class="error-code">404</h1>
      <h2 class="error-title">抱歉，您访问的页面不存在</h2>
      <p class="error-desc">您可能输错了网址，或者该页面已被删除。</p>
      
      <el-button type="primary" size="large" round @click="goHome">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.error-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5; // 柔和的背景灰

  .content {
    text-align: center;
    padding: 40px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); // 轻微的阴影增加质感
    
    // 简单的淡入动画
    animation: fadeIn 0.5s ease-out;

    .error-img {
      width: 300px;
      height: auto;
      margin-bottom: 20px;
    }

    .error-code {
      font-size: 60px;
      font-weight: bold;
      color: #303133;
      margin: 0;
      line-height: 1;
    }

    .error-title {
      font-size: 20px;
      color: #303133;
      margin-top: 15px;
      font-weight: 500;
    }

    .error-desc {
      font-size: 14px;
      color: #909399;
      margin: 10px 0 30px;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>