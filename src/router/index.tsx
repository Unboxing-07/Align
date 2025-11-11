import { createBrowserRouter, Navigate } from "react-router-dom"
import { Login } from "../pages/Login"
import { Signup } from "../pages/Signup"
import { Workspace } from "../pages/Workspace"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/workspace",
    element: <Workspace />,
  },
])
