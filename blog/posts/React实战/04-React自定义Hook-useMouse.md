---
title: React 自定义 Hook - useMouse
date: 2026-03-28
tags: [React, Hooks, 面试]
---

# React 自定义 Hook - useMouse

自定义 Hook 是 React 16.8 引入的强大特性，允许在组件之间复用有状态的逻辑。

## 1. 什么是自定义 Hook？

自定义 Hook 是以 `use` 开头的函数，可以在其中调用其他 Hook：

```javascript
function useMouse() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  return position
}
```

## 2. useMouse 实现

```tsx
function useMouse() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  return position
}
```

## 3. 使用自定义 Hook

```tsx
function MouseTracker() {
  const { x, y } = useMouse()
  
  return (
    <div>
      Mouse position: ({x}, {y})
    </div>
  )
}
```

## 4. 自定义 Hook 规则

1. **以 `use` 开头**：React 通过这个约定识别 Hook
2. **只在顶层调用**：不要在循环、条件、嵌套函数中调用 Hook
3. **只在 React 函数中调用**：不能在普通 JavaScript 函数中调用

## 5. 更多自定义 Hook 示例

### useDebounce

```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}
```

### useLocalStorage

```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })
  
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  
  return [value, setValue]
}
```

## 6. 面试高频问题

### Q: 自定义 Hook 和普通函数的区别？

自定义 Hook 可以调用其他 Hook（useState、useEffect 等），普通函数不行。

### Q: 什么时候用自定义 Hook？

- 多个组件需要相同的逻辑
- 逻辑包含多个 Hook
- 需要复用状态逻辑

## 7. 总结

自定义 Hook 让我们把有状态的逻辑提取出来复用，是 React 开发中的重要技巧。
