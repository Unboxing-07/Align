import { createBrowserRouter, Navigate } from "react-router-dom"
import { Login } from "../pages/Login"
import { Signup } from "../pages/Signup"
import { WorkspaceList } from "../pages/WorkspaceList"
import { WorkspaceDetail } from "../pages/WorkspaceDetail"
import { WorkspaceMembers } from "../pages/WorkspaceMembers"
import { WorkflowPage } from "../pages/WorkflowPage"
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
    path: "/workspace/:id",
    element: <WorkspaceDetail />,
  },
  {
    path: "/workspace/:id/members",
    element: <WorkspaceMembers />,
  },
  {
    path: "/workspace/:id/workflow/:workflowId",
    element: <WorkflowPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
