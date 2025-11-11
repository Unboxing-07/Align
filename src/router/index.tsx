import { createBrowserRouter, Navigate } from "react-router-dom"
import { Login } from "../pages/Login"
import { Signup } from "../pages/Signup"
import { WorkspaceList } from "../pages/WorkspaceList"
import { NotFound } from "../pages/NotFound"

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
    element: <WorkspaceList />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
