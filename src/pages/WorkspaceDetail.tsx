import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { FatInput } from "../components/FatInput"
import { WorkflowCard } from "../components/WorkflowCard"
import { LineButton } from "../components/LineButton"
import { Loading } from "../components/Loading"
import { Send } from "lucide-react"
import { workspaceService } from "../services/workspace"
import { workflowService } from "../services/workflow"
import { processPromptWorkflow } from "../services/promptWorkflow"
import { promptWorkflowToReactFlow } from "../utils/promptToReactFlow"
import type { WorkspaceType } from "../types/workspace"

type WorkflowStatus = "progress" | "done"

export const WorkspaceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workflowInput, setWorkflowInput] = useState("")
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus>("progress")
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (id) {
      loadWorkspace()
    }
  }, [id])

  const loadWorkspace = async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await workspaceService.getWorkspace(id)
      setWorkspace(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace")
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkflows = workspace?.workflow.filter((w) => {
    // totalNodeCount가 0이면 In Progress, totalNodeCount > 0이고 모두 done이면 Done
    const isDone = (w.totalNodeCount ?? 0) > 0 && w.doneNodeCount === w.totalNodeCount
    return statusFilter === "done" ? isDone : !isDone
  }) || []

  const handleCreateWorkflow = async () => {
    if (!id) return

    try {
      const workflowName = `${workspace?.workflow.length ? workspace.workflow.length + 1 : 1}th workflow`
      const newWorkflow = await workflowService.createWorkflow({
        workspaceId: id,
        name: workflowName,
      })
      // Navigate to the new workflow page
      navigate(`/workspace/${id}/workflow/${newWorkflow.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workflow")
    }
  }

  const handleGenerateWorkflow = async () => {
    if (!id || !workspace || !workflowInput.trim()) return

    try {
      setIsGenerating(true)
      setError("")

      // Call AI to generate workflow
      const response = await processPromptWorkflow({
        action: "create",
        user_input: workflowInput,
        assignee_list: workspace.assigneeList.map((a) => ({
          name: a.name,
          email: a.email,
          role: a.role,
        })),
      })

      if (!response.success || !response.workflow) {
        throw new Error(response.error || "Failed to generate workflow")
      }

      // Convert PromptWorkflow to ReactFlow nodes/edges
      const { nodes, edges } = promptWorkflowToReactFlow(response.workflow)

      // Create workflow in backend
      const newWorkflow = await workflowService.createWorkflow({
        workspaceId: id,
        name: response.workflow.workflow_name,
      })

      // Save nodes and edges
      await workflowService.updateWorkflowNodes(newWorkflow.id, {
        nodes,
        edges,
      })

      // Clear input and navigate
      setWorkflowInput("")
      navigate(`/workspace/${id}/workflow/${newWorkflow.id}`)
    } catch (err) {
      console.error("Generate workflow error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate workflow")
      setIsGenerating(false)
    }
  }

  if (loading || isGenerating) {
    return <Loading />
  }

  if (error || !workspace) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-red-500">{error || "Workspace not found"}</p>
      </div>
    )
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
          <LineButton onClick={() => navigate(`/workspace/${id}/my-tasks`)}>My Tasks</LineButton>
        </div>
      </div>



      {/* Main content */}
      <div className="flex flex-col items-center pt-22.5">
        <h1 className="text-black text-[28px] mb-6">{workspace.name}</h1>

        <div className="relative w-135 mb-3.5">
          <FatInput
            placeholder="Our team have to create a marketing poster"
            value={workflowInput}
            onChange={(e) => setWorkflowInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleGenerateWorkflow()
              }
            }}
            className="w-full rounded-full"
          />
          <button
            onClick={handleGenerateWorkflow}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 bg-black rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!workflowInput.trim()}
          >
            <Send size={20} className="text-white" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-135 mb-3.5 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

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

          <LineButton className="text-xs py-1" onClick={handleCreateWorkflow}>+ New Workflow</LineButton>
        </div>

        {/* Workflow list */}
        <div className="w-132 flex flex-col gap-2">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              name={workflow.name}
              doneCount={workflow.doneNodeCount ?? 0}
              totalCount={workflow.totalNodeCount ?? 0}
              onClick={() => navigate(`/workspace/${id}/workflow/${workflow.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
