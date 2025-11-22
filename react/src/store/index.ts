import { configureStore } from '@reduxjs/toolkit'
import todoListReducer from './todoList'
import type { TodoItemType } from '@/store/todoList'

export type StateType = {
  todoList: TodoItemType[]
}


const store = configureStore({
  reducer: {
    todoList: todoListReducer,
  },
})
export default store
