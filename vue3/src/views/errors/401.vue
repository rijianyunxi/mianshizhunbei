<template>
  <div class="error-container">
    <div class="content">
      <img src="https://illustrations.popsy.co/amber/surr-access-denied.svg" alt="401" class="error-img" />
      
      <h1 class="error-code">401</h1>
      <h2 class="error-title">您没有操作权限</h2>
      <p class="error-desc">当前账号权限不足，请联系管理员或切换账号。</p>
      
      <div class="btn-group">
        <el-button type="primary" size="large" round @click="goHome">
          返回首页
        </el-button>
        <el-button size="large" round @click="goLogin">
          重新登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goLogin = () => {
  // 可以在这里清除 token
  // localStorage.removeItem('token')
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.error-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;

  .content {
    text-align: center;
    padding: 50px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    animation: fadeIn 0.5s ease-out;

    .error-img {
      width: 280px; // 稍微调整大小
      margin-bottom: 20px;
    }

    .error-code {
      font-size: 60px;
      font-weight: bold;
      color: #e6a23c; // 使用警告色（橙色）
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

    .btn-group {
      display: flex;
      gap: 15px;
      justify-content: center;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>