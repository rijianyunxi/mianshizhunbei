import { useState } from 'react'
import type { FC } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addTodo, toggleTodo, removeTodo } from '@/store/todoList'
import type { StateType } from '@/store/index'
import type { TodoItemType } from '@/store/todoList'
// 1. 导入模块化样式对象
import styles from './todoListReduxDemo.module.scss'

const TodoListReduxDemo: FC = () => {
    const [title, setTitle] = useState('')
    const dispatch = useDispatch()
    const todoList = useSelector<StateType, TodoItemType[]>((state) => state.todoList)

    const dealInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const addNewTodo = () => {
        if (title.trim() === '') return
        dispatch(addTodo({ 
            id: Date.now(), 
            time: new Date().toLocaleString(), 
            title: title.trim(), 
            completed: false 
        }))
        setTitle('')
    }

    return (
        // 2. 使用 styles.className
        <div className={styles.appContainer}>
            <div className={styles.card}>
                <h1 className={styles.title}>My Tasks</h1>
                
                <div className={styles.inputGroup}>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={dealInput}
                        placeholder="What needs to be done?" 
                        className={styles.input}
                    />
                    <button onClick={addNewTodo} className={styles.btnPrimary}>
                        Add Task
                    </button>
                </div>

                <div className={styles.stats}>
                    <p>Total Tasks: <span>{todoList.length}</span></p>
                </div>

                <ul className={styles.list}>
                    {todoList.map((todo) => (
                        <li 
                            key={todo.id} 
                            // 3. 动态类名拼接：基础样式 + 条件样式
                            className={`${styles.item} ${todo.completed ? styles.completed : ''}`}
                        >
                            <div className={styles.content}>
                                <span className={styles.itemTitle}>{todo.title}</span>
                                <span className={styles.itemTime}>{todo.time}</span>
                            </div>
                            
                            <div className={styles.actions}>
                                <span className={`${styles.badge} ${todo.completed ? styles.done : styles.pending}`}>
                                    {todo.completed ? 'Done' : 'Pending'}
                                </span>
                                <button 
                                    className={styles.btnOutline}
                                    onClick={() => dispatch(toggleTodo(todo.id))}
                                >
                                    {todo.completed ? 'Undo' : 'Check'}
                                </button>
                                <button 
                                    className={styles.btnDanger}
                                    onClick={() => dispatch(removeTodo(todo.id))}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                
                {todoList.length === 0 && (
                    <div className={styles.emptyState}>
                        No tasks yet. Add one above!
                    </div>
                )}
            </div>
        </div>
    )
}

export default TodoListReduxDemo