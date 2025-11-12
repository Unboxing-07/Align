import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { WorkspaceCard } from "../components/WorkspaceCard"
import { AddWorkspaceCard } from "../components/AddWorkspaceCard"
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal"
import { workspaceService } from "../services/workspace"
import type { WorkspaceType } from "../types/workspace"

export const WorkspaceList = () => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setLoading(true)
      const data = await workspaceService.getWorkspaces()
      setWorkspaces(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async (name: string) => {
    try {
      await workspaceService.createWorkspace({ name })
      setIsModalOpen(false)
      await loadWorkspaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
    }
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-gray-200">Loading workspaces...</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      <Logo absolute />

      <div className="flex flex-col items-center pt-42.5">
        <h1 className="text-black text-[28px] mb-6">Choose a workspace</h1>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <div className="w-196 flex flex-col gap-3.5">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              name={workspace.name}
              remainingWorkflows={workspace.workflow.length}
              assignees={workspace.assigneeList.map(a => a.email)}
              onClick={() => navigate(`/workspace/${workspace.id}`)}
            />
          ))}

          <AddWorkspaceCard onClick={() => setIsModalOpen(true)} />
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateWorkspace}
      />
    </div>
  )
}
