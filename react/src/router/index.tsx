import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "@/views/login/Login";
import NotFoundPage from "@/views/notFound/NotFound";
import MainLayout from "@/layout/Layout";
import TodoListReduxDemo from "@/views/demo/todoListReduxDemo/TodoListReduxDemo";
import User from "@/views/user/User";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,

    children: [
      {
      index: true,
      element: <Navigate to="user" replace />,
    },
    {
      path: "user",
      element: <User />,
    },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/todoListReduxDemo",
    element: <TodoListReduxDemo />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
