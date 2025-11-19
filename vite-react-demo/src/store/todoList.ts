import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'



export type TodoItemType = {
    id: number
    title: string
    completed: boolean
    time: string
}


const todoListSlice = createSlice({
    name: 'todoList',
    initialState: [] as TodoItemType[],
    reducers: {
        addTodo: (state: TodoItemType[], action: PayloadAction<TodoItemType>) => {
            state.push(action.payload)
            // 根据time排序
            state.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        },
        toggleTodo: (state: TodoItemType[], action: PayloadAction<number>) => {
            const todo = state.find((todo) => todo.id === action.payload)
            if (todo) {
                todo.completed = !todo.completed
            }
        },
        removeTodo: (state: TodoItemType[], action: PayloadAction<number>) => {
            return state.filter((todo) => todo.id !== action.payload)
        },
    },
})

export const { addTodo, toggleTodo, removeTodo } = todoListSlice.actions

export default todoListSlice.reducer