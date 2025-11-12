import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { LineButton } from "../components/LineButton"
import { MyTaskCard } from "../components/MyTaskCard"
import { api } from "../lib/api"

type MyTask = {
  id: string
  title: string
  description: string
  deadline: Date | string
  workflowId: string
  workflowName: string
  nodeId: string
  status: "pending" | "progress" | "completed" | "done"
}

export const MyTasks = () => {
  const { id: workspaceId } = useParams()
  const navigate = useNavigate()
  const [workspaceName, setWorkspaceName] = useState("")
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (workspaceId) {
      loadMyTasks()
    }
  }, [workspaceId])

  const loadMyTasks = async () => {
    if (!workspaceId) return

    try {
      setLoading(true)
      const data = await api.get<{
        workspaceName: string
        tasks: MyTask[]
      }>(`/workspaces/${workspaceId}/my-tasks`)
      setWorkspaceName(data.workspaceName)
      setTasks(data.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: MyTask) => {
    // Navigate to workflow page with the node selected
    navigate(`/workspace/${workspaceId}/workflow/${task.workflowId}?nodeId=${task.nodeId}`)
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-gray-200">Loading tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="flex justify-between px-6 pt-3.5">
        <Logo />
        <LineButton onClick={() => navigate(`/workspace/${workspaceId}`)} isThin>
          Back to Workspace
        </LineButton>
      </div>

      <div className="flex flex-col items-center pt-42.5">
        <h1 className="text-black text-[28px] mb-14">
          My Tasks ({workspaceName})
        </h1>

        <div className="flex flex-col gap-4 w-196">
          {tasks.length === 0 ? (
            <p className="text-gray-200 text-center">No tasks assigned to you</p>
          ) : (
            tasks.map((task) => (
              <MyTaskCard
                key={task.id}
                title={task.title}
                description={task.description}
                workflowName={task.workflowName}
                deadline={task.deadline}
                status={task.status}
                onClick={() => handleTaskClick(task)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
