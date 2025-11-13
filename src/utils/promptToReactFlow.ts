// Convert PromptWorkflow to ReactFlow nodes and edges

import type { Node, Edge } from "@xyflow/react";
import type { PromptWorkflow } from "../types/prompt";
import type { TaskType } from "../types/task";

/**
 * Converts PromptWorkflow to ReactFlow nodes and edges
 */
export function promptWorkflowToReactFlow(
  promptWorkflow: PromptWorkflow
): { nodes: Node<TaskType>[]; edges: Edge[] } {
  const nodes: Node<TaskType>[] = [];
  const edges: Edge[] = [];

  // Convert tasks to nodes
  promptWorkflow.tasks.forEach((task, index) => {
    const taskData: TaskType = {
      title: task.name,
      description: task.notes || `Output: ${task.output.join(", ")}`,
      assignee: {
        name: task.assignee.name || "Unassigned",
        email: task.assignee.email || "unassigned@example.com",
        role: task.assignee.role || "Role",
      },
      input: "", // Will be auto-filled by flow logic
      output: task.output.join(", "),
      deadline: task.deadline ? new Date(task.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: mapPromptStatusToTaskStatus(task.status),
    };

    const node: Node<TaskType> = {
      id: task.id,
      type: "task",
      position: { x: 0, y: index * 200 }, // Temporary position, will be adjusted by ELK
      data: taskData,
    };

    nodes.push(node);
  });

  // Convert flows to edges
  promptWorkflow.flows.forEach((flow) => {
    const edge: Edge = {
      id: `${flow.from}-${flow.to}`,
      source: flow.from,
      target: flow.to,
      type: "default",
    };

    edges.push(edge);
  });

  return { nodes, edges };
}

/**
 * Maps PromptTask status to TaskType status
 */
function mapPromptStatusToTaskStatus(
  promptStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DONE"
): "pending" | "progress" | "completed" | "done" {
  switch (promptStatus) {
    case "PENDING":
      return "pending";
    case "IN_PROGRESS":
      return "progress";
    case "COMPLETED":
      return "completed";
    case "DONE":
      return "done";
    default:
      return "pending";
  }
}

/**
 * Validates if the conversion was successful
 */
export function validateConversion(
  promptWorkflow: PromptWorkflow,
  nodes: Node<TaskType>[],
  edges: Edge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if all tasks were converted to nodes
  if (promptWorkflow.tasks.length !== nodes.length) {
    errors.push(
      `Task count mismatch: expected ${promptWorkflow.tasks.length}, got ${nodes.length}`
    );
  }

  // Check if all flows were converted to edges
  if (promptWorkflow.flows.length !== edges.length) {
    errors.push(
      `Flow count mismatch: expected ${promptWorkflow.flows.length}, got ${edges.length}`
    );
  }

  // Check if all node IDs are unique
  const nodeIds = new Set(nodes.map((n) => n.id));
  if (nodeIds.size !== nodes.length) {
    errors.push("Duplicate node IDs found");
  }

  // Check if all edge references exist
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
