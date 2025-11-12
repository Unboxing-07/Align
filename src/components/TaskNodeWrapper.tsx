import { useState } from "react";
import { useReactFlow, type NodeProps } from "@xyflow/react";
import type { TaskType } from "../types/task";
import { TaskNode } from "./TaskNode";
import { Plus, Trash2 } from "lucide-react";

export const TaskNodeWrapper = (props: NodeProps) => {
  const task = props.data as TaskType;
  const [isHovered, setIsHovered] = useState(false);
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

  const handleAddNextNode = (e: React.MouseEvent) => {
    e.stopPropagation();

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
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "pending",
    };

    const newNodeId = `task-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "task",
      position: { x: 0, y: 0 }, // ELK will calculate the actual position
      data: newTask,
    };

    const newEdge = {
      id: `edge-${props.id}-${newNodeId}`,
      source: props.id,
      target: newNodeId,
    };

    // Get current state and update both at once
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    console.log('Adding next node:', {
      currentNodesCount: currentNodes.length,
      currentEdgesCount: currentEdges.length,
      newEdge,
      newNode: newNodeId
    });

    setEdges([...currentEdges, newEdge]);
    setNodes([...currentNodes, newNode]);
  };

  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentNodes = getNodes();
    const currentEdges = getEdges();

    // Find incoming edges (parents -> this node)
    const incomingEdges = currentEdges.filter((edge) => edge.target === props.id);

    // Find outgoing edges (this node -> children)
    const outgoingEdges = currentEdges.filter((edge) => edge.source === props.id);

    // Remove all edges connected to this node
    let newEdges = currentEdges.filter(
      (edge) => edge.source !== props.id && edge.target !== props.id
    );

    // For each child node
    outgoingEdges.forEach((outgoingEdge) => {
      const childId = outgoingEdge.target;

      // Check if child has other parents (excluding the node being deleted)
      const childHasOtherParents = newEdges.some((edge) => edge.target === childId);

      // If child has no other parents, inherit parent connections
      if (!childHasOtherParents && incomingEdges.length > 0) {
        // Connect each parent to this child
        const inheritedEdges = incomingEdges.map((incomingEdge) => ({
          id: `edge-${incomingEdge.source}-${childId}`,
          source: incomingEdge.source,
          target: childId,
        }));
        newEdges = [...newEdges, ...inheritedEdges];
      }
    });

    // Update edges and nodes together
    setEdges(newEdges);
    setNodes(currentNodes.filter((node) => node.id !== props.id));
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TaskNode task={task} />

      {/* Delete Button (Top Left) */}
      {isHovered && (
        <button
          onClick={handleDeleteNode}
          className="absolute -left-3 -top-3 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-lg z-10"
          title="Delete task"
        >
          <Trash2 size={14} className="text-white" />
        </button>
      )}

      {/* Next Node Button (Right) */}
      {isHovered && (
        <button
          onClick={handleAddNextNode}
          className="absolute -right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue rounded-full flex items-center justify-center hover:bg-blue/80 active:scale-95 transition-all duration-200 shadow-lg z-10"
          title="Add next task"
        >
          <Plus size={20} className="text-white" />
        </button>
      )}
    </div>
  );
};
