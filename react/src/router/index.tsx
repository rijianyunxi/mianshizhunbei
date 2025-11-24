import { createBrowserRouter } from 'react-router-dom'
import Login from '@/views/login/Login'
import NotFoundPage from '@/views/notFound/NotFound'
import MainLayout from '@/layout/Layout'
import TodoListReduxDemo from '@/views/demo/todoListReduxDemo/TodoListReduxDemo'


const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/todoListReduxDemo',
    element: <TodoListReduxDemo />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },

])


export default router;
