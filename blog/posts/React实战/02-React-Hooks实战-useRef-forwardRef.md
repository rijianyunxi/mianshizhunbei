---
title: React Hooks 实战 - useRef 与 forwardRef
date: 2026-03-28
tags: [React, Hooks, 面试]
---

# React Hooks 实战 - useRef 与 forwardRef

useRef 和 forwardRef 是 React 中两个重要的 Hook，本文深入讲解它们的用法和原理。

## 1. useRef

### 基本用法

```tsx
function TextInput() {
  const inputRef = useRef(null)
  
  const focusInput = () => {
    inputRef.current?.focus()
  }
  
  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </div>
  )
}
```

### 保存可变值

```tsx
function Counter() {
  const countRef = useRef(0)
  
  const increment = () => {
    countRef.current++ // 不触发重新渲染
    console.log(countRef.current)
  }
  
  return <button onClick={increment}>Click</button>
}
```

### useRef vs useState

| 特性 | useRef | useState |
|------|--------|---------|
| 更新触发渲染 | ❌ | ✅ |
| 持久化值 | ✅ | ✅ |
| 用途 | DOM 引用、计时器 | 触发 UI 更新 |

## 2. forwardRef

### 为什么需要 forwardRef？

函数组件默认不接受 ref：

```tsx
// ❌ 不工作
function MyInput(props) {
  return <input ref={props.ref} />
}

// ✅ 使用 forwardRef
const MyInput = forwardRef((props, ref) => {
  return <input ref={ref} />
})
```

### 使用场景

```tsx
function Parent() {
  const inputRef = useRef()
  
  return <MyInput ref={inputRef} />
}
```

## 3. useImperativeHandle

自定义暴露给父组件的 ref：

```tsx
const MyInput = forwardRef((props, ref) => {
  const inputRef = useRef()
  
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    value: inputRef.current.value
  }), [])
  
  return <input ref={inputRef} />
})

// 父组件
const parentRef = useRef()
parentRef.current.focus() // ✅
parentRef.current.value // ✅
```

## 4. ref 回调函数

```tsx
function App() {
  const [value, setValue] = useState('')
  
  return (
    <input
      ref={(node) => {
        // node 是 DOM 元素
        if (node) {
          setValue(node.value)
        }
      }}
    />
  )
}
```

## 5. 面试高频问题

### Q: useRef 和 useState 的区别？

- useRef 更新不触发渲染，用于保存不需要渲染的值
- useState 更新触发渲染，用于需要更新 UI 的值

### Q: forwardRef 有什么用？

让父组件能够访问子组件的 DOM 元素或子组件暴露的方法。

## 6. 总结

- useRef：DOM 引用和可变值
- forwardRef：跨组件传递 ref
- useImperativeHandle：自定义 ref 行为
