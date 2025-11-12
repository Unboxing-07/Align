import { useState, useCallback, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Controls,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import ELK from "elkjs/lib/elk.bundled.js"
import { Logo } from "../components/Logo"
import { LineButton } from "../components/LineButton"
import { workflowService } from "../services/workflow"
import { TaskNodeWrapper } from "../components/TaskNodeWrapper"
import { TaskDetailPanel } from "../components/TaskDetailPanel"
import { api } from "../lib/api"
import type { TaskType } from "../types/task"
import type { AssigneeType, WorkspaceType } from "../types/workspace"
import { PenLine, Check, X } from "lucide-react"

const elk = new ELK()

const initialNodes: Node[] = []

const initialEdges: Edge[] = []

const nodeTypes = {
  task: TaskNodeWrapper,
}

const WorkflowPageContent = () => {
  const { id: workspaceId, workflowId } = useParams()
  const navigate = useNavigate()
  const { fitView } = useReactFlow()
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [workflowName, setWorkflowName] = useState<string>("")
  const [editingName, setEditingName] = useState(false)
  const [editedWorkflowName, setEditedWorkflowName] = useState<string>("")
  const [workspaceMembers, setWorkspaceMembers] = useState<AssigneeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedNode, setSelectedNode] = useState<Node<TaskType> | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLayouting, setIsLayouting] = useState(false)

  // ELK layout function
  const getLayoutedElements = useCallback(async (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return { nodes, edges }

    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.spacing.nodeNode": "80",
        "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      },
      children: nodes.map((node) => ({
        id: node.id,
        width: 284,
        height: 154,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    }

    const layoutedGraph = await elk.layout(graph)

    const layoutedNodes = nodes.map((node) => {
      const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id)
      return {
        ...node,
        position: {
          x: layoutedNode?.x ?? node.position.x,
          y: layoutedNode?.y ?? node.position.y,
        },
      }
    })

    return { nodes: layoutedNodes, edges }
  }, [])

  // Apply layout when nodes or edges change
  useEffect(() => {
    if (nodes.length === 0 || isLayouting) return

    const layoutTimer = setTimeout(async () => {
      setIsLayouting(true)
      try {
        const { nodes: layoutedNodes } = await getLayoutedElements(nodes, edges)
        setNodes(layoutedNodes)
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 200 })
        }, 50)
      } catch (err) {
        console.error("Layout error:", err)
      } finally {
        setIsLayouting(false)
      }
    }, 50)

    return () => clearTimeout(layoutTimer)
  }, [JSON.stringify(edges.map(e => ({ s: e.source, t: e.target }))), nodes.length])

  useEffect(() => {
    if (workflowId) {
      loadWorkflow()
    }
    if (workspaceId) {
      loadWorkspaceMembers()
    }
  }, [workflowId, workspaceId])

  // Auto-save nodes and edges when they change
  useEffect(() => {
    if (!workflowId || loading) return

    const timer = setTimeout(async () => {
      try {
        console.log('Auto-saving workflow:', {
          nodesCount: nodes.length,
          edgesCount: edges.length,
          edges: edges
        })
        await workflowService.updateWorkflowNodes(workflowId, {
          nodes,
          edges,
        })
        console.log('Auto-save successful')
      } catch (err) {
        console.error("Failed to auto-save workflow:", err)
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(timer)
  }, [nodes, edges, workflowId, loading])

  const loadWorkflow = async () => {
    if (!workflowId) return

    try {
      setLoading(true)
      const workflow = await workflowService.getWorkflow(workflowId)
      setWorkflowName(workflow.name)

      // Load nodes and edges from workflow if they exist
      if (workflow.nodes && Array.isArray(workflow.nodes) && workflow.nodes.length > 0) {
        setNodes(workflow.nodes)
      }

      if (workflow.edges && Array.isArray(workflow.edges) && workflow.edges.length > 0) {
        setEdges(workflow.edges)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workflow")
    } finally {
      setLoading(false)
    }
  }

  const loadWorkspaceMembers = async () => {
    if (!workspaceId) return

    try {
      const workspace = await api.get<WorkspaceType>(`/workspaces/${workspaceId}`)
      setWorkspaceMembers(workspace.assigneeList || [])
    } catch (err) {
      console.error("Failed to load workspace members:", err)
    }
  }

  const handleStartEditName = () => {
    setEditedWorkflowName(workflowName)
    setEditingName(true)
  }

  const handleSaveWorkflowName = async () => {
    if (!workflowId || !editedWorkflowName.trim()) return

    try {
      await workflowService.updateWorkflow(workflowId, editedWorkflowName)
      setWorkflowName(editedWorkflowName)
      setEditingName(false)
    } catch (err) {
      console.error("Failed to update workflow name:", err)
      setError("Failed to update workflow name")
    }
  }

  const handleCancelEditName = () => {
    setEditingName(false)
    setEditedWorkflowName("")
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

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const taskNode = node as Node<TaskType>

      // Check if node should transition from pending to progress
      if (taskNode.data.status === 'pending') {
        // Find incoming edges (previous nodes)
        const incomingEdges = edges.filter((edge) => edge.target === taskNode.id)

        // If no previous nodes or all previous nodes are done, change to progress
        const shouldBeInProgress = incomingEdges.length === 0 ||
          incomingEdges.every((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source) as Node<TaskType> | undefined
            return sourceNode?.data?.status === 'done'
          })

        if (shouldBeInProgress) {
          // Update node status to progress
          const updatedNode = {
            ...taskNode,
            data: {
              ...taskNode.data,
              status: 'progress' as const,
            },
          }

          const updatedNodes = nodes.map((n) =>
            n.id === taskNode.id ? updatedNode : n
          )
          setNodes(updatedNodes)
          setSelectedNode(updatedNode)
          setIsPanelOpen(true)
          return
        }
      }

      setSelectedNode(taskNode)
      setIsPanelOpen(true)
    },
    [nodes, edges]
  )

  const handleTaskUpdate = useCallback(
    async (updatedTask: TaskType, shouldReload: boolean = false) => {
      if (!selectedNode || !workflowId) return

      const updatedNodes = nodes.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: updatedTask }
          : node
      )
      setNodes(updatedNodes)

      // If we need to reload (e.g., status changed to 'done'), save first then reload
      if (shouldReload) {
        try {
          // Save the updated nodes to backend
          await workflowService.updateWorkflowNodes(workflowId, {
            nodes: updatedNodes,
            edges,
          })
          // Reload workflow after successful save
          await loadWorkflow()
        } catch (err) {
          console.error("Failed to save and reload workflow:", err)
        }
      }
      // Otherwise, let the auto-save useEffect handle the save
    },
    [selectedNode, nodes, edges, workflowId, loadWorkflow]
  )

  // Get previous node's output
  const getPreviousNodeOutput = useCallback((): string => {
    if (!selectedNode) return ""

    // Find edges that connect to the selected node (where selected node is the target)
    const incomingEdge = edges.find((edge) => edge.target === selectedNode.id)
    if (!incomingEdge) return ""

    // Find the source node
    const sourceNode = nodes.find((node) => node.id === incomingEdge.source) as Node<TaskType> | undefined
    if (!sourceNode || !sourceNode.data) return ""

    return sourceNode.data.output || ""
  }, [selectedNode, edges, nodes])

  const onPaneClick = useCallback(
    async () => {
      // Only allow creating the first node via click
      if (nodes.length > 0) return

      // Create a default task data
      // First node starts as 'progress', others start as 'pending'
      const newTask: TaskType = {
        title: "New Task",
        description: "Click to edit description",
        assignee: {
          name: "Unassigned",
          email: "user@example.com",
          role: "Role",
        },
        input: "",
        output: "",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "progress", // First node starts as in progress
      }

      // Create a new node (position will be set by ELK)
      const newNode: Node<TaskType> = {
        id: `task-${Date.now()}`,
        type: "task",
        position: { x: 0, y: 0 }, // ELK will calculate the actual position
        data: newTask,
      }

      const newNodes = [newNode]
      setNodes(newNodes)

      // Save to backend
      if (workflowId) {
        try {
          await workflowService.updateWorkflowNodes(workflowId, {
            nodes: newNodes,
            edges: [],
          })
        } catch (err) {
          console.error("Failed to save node:", err)
          setError("Failed to save node")
        }
      }
    },
    [nodes.length, workflowId]
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
          <div className="text-gray-200">/</div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedWorkflowName}
                onChange={(e) => setEditedWorkflowName(e.target.value)}
                className="text-gray-200 text-base outline-none border-b border-gray-100 px-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveWorkflowName()
                  if (e.key === "Escape") handleCancelEditName()
                }}
              />
              <button
                onClick={handleSaveWorkflowName}
                className="p-1 hover:bg-gray-50 rounded"
                title="Save"
              >
                <Check size={16} className="text-blue" />
              </button>
              <button
                onClick={handleCancelEditName}
                className="p-1 hover:bg-gray-50 rounded"
                title="Cancel"
              >
                <X size={16} className="text-gray-200" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-gray-200">{workflowName}</div>
              <button
                onClick={handleStartEditName}
                className="p-1 hover:bg-gray-50 rounded"
                title="Edit workflow name"
              >
                <PenLine size={16} className="text-gray-200" />
              </button>
            </div>
          )}
        </div>

        <LineButton gray onClick={() => navigate(`/workspace/${workspaceId}`)} isThin>go to workspace</LineButton>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodesDraggable={false}
          nodesConnectable={true}
          fitView
          defaultEdgeOptions={{
            style: { stroke: '#D9D9D9', strokeWidth: 2 },
            // type: 'smoothstep',
          }}
          style={{
            backgroundColor: "#efefef"
          }}
        >
          <Controls />
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-200 text-base">
              Touch the screen and create your first task
            </p>
          </div>
        )}
      </div>

      {/* Task Detail Panel */}
      {selectedNode && (
        <TaskDetailPanel
          task={selectedNode.data}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onUpdate={handleTaskUpdate}
          previousNodeOutput={getPreviousNodeOutput()}
          workspaceMembers={workspaceMembers}
        />
      )}
    </div>
  )
}

export const WorkflowPage = () => {
  return (
    <ReactFlowProvider>
      <WorkflowPageContent />
    </ReactFlowProvider>
  )
}
