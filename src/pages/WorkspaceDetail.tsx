import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { FatInput } from "../components/FatInput"
import { WorkflowCard } from "../components/WorkflowCard"
import { LineButton } from "../components/LineButton"
import { Send } from "lucide-react"

type WorkflowStatus = "progress" | "done"

export const WorkspaceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflowInput, setWorkflowInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus>("progress")

  const workspace = {
    id,
    name: "Workspace Name",
  }

  const workflows = [
    {
      id: "1",
      name: "Workflow name",
      doneCount: 12,
      totalCount: 120,
      status: "progress" as WorkflowStatus,
    },
  ]

  const filteredWorkflows = workflows.filter((w) => w.status === statusFilter)

  const handleCreateWorkflow = () => {
    if (workflowInput.trim()) {
      console.log("Creating workflow:", workflowInput)
      // TODO: API 호출로 워크플로우 생성
      setWorkflowInput("")
    }
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="flex justify-between px-6 pt-3.5">
        <div className="flex gap-2.5 items-top">
          <Logo />
          <LineButton onClick={() => navigate("/workspace")} isThin>
            Back to workspace list
          </LineButton>
        </div>

        <div className="flex flex-col items-end gap-1">
          <LineButton onClick={() => navigate(`/workspace/${id}/members`)}>Member</LineButton>
          <LineButton>My Tasks</LineButton>
        </div>
      </div>



      {/* Main content */}
      <div className="flex flex-col items-center pt-42.5">
        <h1 className="text-black text-[28px] mb-6">{workspace.name}</h1>

        <div className="relative w-135 mb-3.5">
          <FatInput
            placeholder="Our team have to create a marketing poster"
            value={workflowInput}
            onChange={(e) => setWorkflowInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateWorkflow()}
            className="w-full rounded-full"
          />
          <button
            onClick={handleCreateWorkflow}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 bg-black rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            disabled={!workflowInput.trim()}
          >
            <Send size={20} className="text-white" />
          </button>
        </div>

        {/* Filter and New Workflow button */}
        <div className="w-132 flex items-center justify-between mb-1.5">
          <div className="flex gap-2">
            <LineButton
              onClick={() => setStatusFilter("progress")}
              gray={statusFilter !== "progress"}
              className="text-xs py-1"
            >
              In Progress
            </LineButton>
            <LineButton
              onClick={() => setStatusFilter("done")}
              gray={statusFilter !== "done"}
              className="text-xs py-1"
            >
              Done
            </LineButton>
          </div>

          <LineButton className="text-xs py-1">+ New Workflow</LineButton>
        </div>

        {/* Workflow list */}
        <div className="w-132 flex flex-col gap-2">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              name={workflow.name}
              doneCount={workflow.doneCount}
              totalCount={workflow.totalCount}
              onClick={() => console.log(`Navigate to workflow ${workflow.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
