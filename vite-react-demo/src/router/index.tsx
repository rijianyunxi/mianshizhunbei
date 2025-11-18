import { createBrowserRouter } from 'react-router-dom'
import Login from '@/views/login/Login'
import NotFoundPage from '@/views/notFound/NotFound'


const router = createBrowserRouter([
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
