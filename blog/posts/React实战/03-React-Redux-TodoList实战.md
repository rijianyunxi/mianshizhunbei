---
title: React Redux TodoList 实战
date: 2026-03-28
tags: [React, Redux, 状态管理, 面试]
---

# React Redux TodoList 实战

Redux 是 React 生态中最成熟的状态管理方案，本文通过 TodoList 演示其核心用法。

## 1. Redux 核心概念

```
Store（单一数据源）
    ↓ dispatch
Action（描述做什么）
    ↓
Reducer（纯函数，计算新状态）
    ↓
新的 Store
```

## 2. 创建 Store

```javascript
import { createStore } from 'redux'

// Reducer
function todoReducer(state = { todos: [] }, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload]
      }
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(t => t.id !== action.payload)
      }
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        )
      }
    default:
      return state
  }
}

const store = createStore(todoReducer)
```

## 3. dispatch Action

```javascript
// 添加
store.dispatch({
  type: 'ADD_TODO',
  payload: { id: 1, text: '学习 Redux', done: false }
})

// 删除
store.dispatch({
  type: 'DELETE_TODO',
  payload: 1
})

// 切换完成状态
store.dispatch({
  type: 'TOGGLE_TODO',
  payload: 1
})
```

## 4. React 组件中使用

### 订阅更新

```jsx
function TodoList() {
  const [todos, setTodos] = useState([])
  
  useEffect(() => {
    // 订阅 store 变化
    const unsubscribe = store.subscribe(() => {
      setTodos(store.getState().todos)
    })
    
    // 初始化
    setTodos(store.getState().todos)
    
    return () => unsubscribe()
  }, [])
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}
```

### Redux Toolkit（推荐）

```javascript
import { configureStore, createSlice } from '@reduxjs/toolkit'

const todoSlice = createSlice({
  name: 'todos',
  initialState: { todos: [] },
  reducers: {
    addTodo: (state, action) => {
      state.todos.push(action.payload)
    },
    toggleTodo: (state, action) => {
      const todo = state.todos.find(t => t.id === action.payload)
      if (todo) todo.done = !todo.done
    }
  }
})

const store = configureStore({
  reducer: {
    todos: todoSlice.reducer
  }
})
```

## 5. useSelector 和 useDispatch

```jsx
import { useSelector, useDispatch } from 'react-redux'

function TodoList() {
  const todos = useSelector(state => state.todos.todos)
  const dispatch = useDispatch()
  
  const addTodo = (text) => {
    dispatch(todoSlice.actions.addTodo({
      id: Date.now(),
      text,
      done: false
    }))
  }
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}
```

## 6. 面试高频问题

### Q: Redux 和 Context 的区别？

| 特性 | Redux | Context |
|------|-------|---------|
| 性能 | 优化过，精准更新 | 可能触发大量重渲染 |
| 生态 | 丰富 | 基础 |
| 学习曲线 | 陡峭 | 平缓 |
| 适用场景 | 大型应用 | 小型应用 |

### Q: Reducer 为什么是纯函数？

- 不修改参数
- 不产生副作用
- 相同输入总是相同输出

## 7. 总结

Redux 核心流程：
1. createStore 创建 Store
2. dispatch 发送 Action
3. Reducer 计算新状态
4. 组件订阅 Store 变化
