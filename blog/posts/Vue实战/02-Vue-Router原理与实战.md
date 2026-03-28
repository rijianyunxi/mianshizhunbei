---
title: Vue Router 原理与实战
date: 2026-03-28
tags: [Vue, VueRouter, 面试]
---

# Vue Router 原理与实战

Vue Router 是 Vue.js 的官方路由管理器，本文讲解其原理和常见用法。

## 1. 两种模式

### Hash 模式

```javascript
// URL 格式：example.com/#/path
// 使用 hashchange 事件监听
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1)
  // 匹配路由
})
```

### History 模式

```javascript
// URL 格式：example.com/path
// 使用 popstate 事件监听
window.addEventListener('popstate', () => {
  const path = window.location.pathname
  // 匹配路由
})

// 需要服务器配置支持
// 所有请求都返回 index.html
```

### 对比

| 特性 | Hash | History |
|------|------|--------|
| URL 美观 | ❌ 有 # | ✅ 美观 |
| 刷新 | ✅ 正常 | ❌ 需要服务器配置 |
| SEO | ❌ 差 | ✅ 好 |

## 2. 基础使用

```javascript
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/user/:id', component: User },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// app.use(router)
```

## 3. 动态路由

```javascript
// 参数路由
{ path: '/user/:id', component: User }

// 获取参数
const User = {
  computed: {
    userId() {
      return this.$route.params.id
    }
  }
}

// 或者使用 useRoute
import { useRoute } from 'vue-router'

const route = useRoute()
console.log(route.params.id)
```

## 4. 嵌套路由

```javascript
{
  path: '/user',
  component: UserLayout,
  children: [
    { path: 'profile', component: UserProfile },
    { path: 'settings', component: UserSettings },
  ]
}
```

## 5. 导航守卫

### 全局守卫

```javascript
// 前置守卫
router.beforeEach((to, from) => {
  // to: 目标路由
  // from: 当前路由
  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/login'
  }
  return true // 放行
})

// 后置守卫
router.afterEach((to, from) => {
  document.title = to.meta.title || 'Default'
})
```

### 路由独享守卫

```javascript
{
  path: '/admin',
  component: Admin,
  beforeEnter: (to, from) => {
    return isAdmin ? true : '/403'
  }
}
```

### 组件内守卫

```javascript
export default {
  beforeRouteEnter(to, from, next) {
    // 组件实例还未创建，不能访问 this
    next(vm => {
      // vm 是组件实例
    })
  },
  beforeRouteUpdate(to, from) {
    // 路由参数变化时调用
    this.fetchData(to.params.id)
  },
  beforeRouteLeave(to, from) {
    // 离开时调用
    const answer = window.confirm('确定离开？')
    if (!answer) return false
  }
}
```

## 6. 面试高频问题

### Q: Hash 和 History 模式的区别？

- Hash：有 #，刷新正常，不需要服务器配置
- History：没有 #，美观，但刷新需要服务器配置

### Q: 导航守卫执行顺序？

1. 组件内 beforeRouteLeave
2. 全局 beforeEach
3. 路由独享 beforeEnter
4. 组件内 beforeRouteEnter
5. 全局 beforeResolve
6. 触发导航

## 7. 总结

Vue Router 核心：
- Hash/History 两种模式
- 动态路由参数
- 导航守卫
- 嵌套路由
