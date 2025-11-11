import { useState } from "react"
import { Logo } from "../components/Logo"
import { WorkspaceCard } from "../components/WorkspaceCard"
import { AddWorkspaceCard } from "../components/AddWorkspaceCard"
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal"

export const WorkspaceList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock data - 나중에 API로 대체
  const workspaces = [
    {
      id: "1",
      name: "Workspace Name",
      remainingWorkflows: 14,
      assignees: ["example@email.com", "user@test.com", "member@workspace.com"],
    },
    {
      id: "2",
      name: "Workspace Name",
      remainingWorkflows: 7,
      assignees: ["example@email.com", "user@test.com", "member@workspace.com"],
    },
  ]

  const handleCreateWorkspace = (name: string) => {
    console.log("Creating workspace:", name)
    // TODO: API 호출로 워크스페이스 생성
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      <Logo />

      <div className="flex flex-col items-center pt-42.5">
        <h1 className="text-black text-[28px] mb-14">Choose a workspace</h1>

        <div className="w-196 flex flex-col gap-3.5">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              name={workspace.name}
              remainingWorkflows={workspace.remainingWorkflows}
              assignees={workspace.assignees}
              onClick={() => console.log(`Navigate to workspace ${workspace.id}`)}
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
