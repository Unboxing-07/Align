import { useState, useCallback, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Logo } from "../components/Logo"
import { LineButton } from "../components/LineButton"
import { workflowService } from "../services/workflow"

const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    position: { x: 250, y: 100 },
    data: { label: "Start Node" },
  },
]

const initialEdges: Edge[] = []

export const WorkflowPage = () => {
  const { id: workspaceId, workflowId } = useParams()
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [workflowName, setWorkflowName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (workflowId) {
      loadWorkflow()
    }
  }, [workflowId])

  const loadWorkflow = async () => {
    if (!workflowId) return

    try {
      setLoading(true)
      const workflow = await workflowService.getWorkflow(workflowId)
      setWorkflowName(workflow.name)

      // Load nodes and edges from workflow if they exist
      if (workflow.nodes && workflow.nodes.length > 0) {
        setNodes(workflow.nodes.map(node => ({
          id: node.id,
          position: { x: 0, y: 0 }, // Will be set from saved data
          data: node.data,
        })))
      }

      if (workflow.edges && workflow.edges.length > 0) {
        setEdges(workflow.edges.map(edge => ({
          id: edge.id,
          source: edge.from,
          target: edge.to,
        })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflow")
    } finally {
      setLoading(false)
    }
  }

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  if (loading) {
    return (
      <div className="w-full h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-gray-200">Loading workflow...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-white relative flex items-center justify-center">
        <Logo absolute />
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-3.5 border-b border-gray-100">
        <div className="flex gap-2.5 items-center">
          <Logo />
          <LineButton onClick={() => navigate(`/workspace/${workspaceId}`)} isThin>
            Back to workspace
          </LineButton>
        </div>

        <h1 className="text-black text-xl font-medium">{workflowName}</h1>

        <div className="flex gap-2">
          <LineButton className="text-sm">Save</LineButton>
          <LineButton className="text-sm">Settings</LineButton>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}
