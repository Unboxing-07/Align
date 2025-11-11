import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import WorkspaceList from './pages/WorkspaceList'
import WorkspaceDetail from './pages/WorkspaceDetail'
import WorkspaceMembers from './pages/WorkspaceMembers'
import WorkspaceMe from './pages/WorkspaceMe'
import WorkspaceProject from './pages/WorkspaceProject'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Workspace routes */}
        <Route path="/workspace" element={<WorkspaceList />} />
        <Route path="/workspace/:id" element={<WorkspaceDetail />} />
        <Route path="/workspace/:id/members" element={<WorkspaceMembers />} />
        <Route path="/workspace/:id/me" element={<WorkspaceMe />} />
        <Route path="/workspace/:workspaceId/:projectId" element={<WorkspaceProject />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
