import { createBrowserRouter } from 'react-router-dom'
import Login from '@/views/login/Login'
import NotFoundPage from '@/views/notFound/NotFound'
import MainLayout from '@/layout/Layout'



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
    path: '*',
    element: <NotFoundPage />,
  },
])


export default router;
