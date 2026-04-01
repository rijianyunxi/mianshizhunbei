<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { path: '/Vitur', title: 'Vitur', tag: '虚拟滚动' },
  { path: '/DirectiveDemo', title: '自定义指令', tag: '基础指令' },
  { path: '/CustomFormTable', title: '复杂报表引擎', tag: '动态表单' },
]

const searchQuery = ref('')

const filteredMenus = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return menuItems
  return menuItems.filter(
    item => item.title.toLowerCase().includes(q) || item.tag?.toLowerCase().includes(q)
  )
})
</script>

<template>
  <aside class="sidebar">
    <div class="logo">Vue3 Demos</div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索组件..."
      />
    </div>

    <nav class="menu">
      <template v-if="filteredMenus.length">
        <router-link
          v-for="item in filteredMenus"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="menu-title">{{ item.title }}</span>
          <span v-if="item.tag" class="menu-tag">{{ item.tag }}</span>
        </router-link>
      </template>
      <div v-else class="empty-tip">无匹配结果</div>
    </nav>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  width: 220px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.search-box {
  padding: 12px 12px 8px;

  input {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 13px;
    outline: none;
    transition: all 0.2s;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    &:focus {
      border-color: rgba(64, 158, 255, 0.5);
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.menu {
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  &.active {
    background: rgba(64, 158, 255, 0.12);
    color: #fff;
  }
}

.menu-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-tip {
  padding: 20px 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
}
</style>
