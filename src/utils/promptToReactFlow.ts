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
      description: task.description,
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
 * Converts ReactFlow nodes and edges back to PromptWorkflow format
 */
export function reactFlowToPromptWorkflow(
  nodes: Node<TaskType>[],
  edges: Edge[],
  workflowName: string
): PromptWorkflow {
  // Convert nodes to tasks
  const tasks = nodes.map((node) => {
    const task = node.data;
    const deadline = task.deadline
      ? new Date(task.deadline).toISOString().split("T")[0]
      : null;

    return {
      id: node.id,
      name: task.title,
      description: task.description,
      output: task.output ? task.output.split(", ").filter(o => o.trim()) : [],
      deadline,
      status: mapTaskStatusToPromptStatus(task.status),
      assignee: {
        name: task.assignee.name === "Unassigned" ? null : task.assignee.name,
        email: task.assignee.email === "unassigned@example.com" ? null : task.assignee.email,
        role: task.assignee.role === "Role" ? null : task.assignee.role,
        status: (task.assignee.name === "Unassigned" || !task.assignee.name) ? "unassigned" as const : "assigned" as const,
      },
      notes: null,
    };
  });

  // Convert edges to flows
  const flows = edges.map((edge) => ({
    from: edge.source,
    to: edge.target,
    type: "depends_on" as const,
  }));

  // Check if workflow is a DAG (no cycles)
  const isDAG = checkIsDAG(nodes, edges);

  // Check if there are unassigned tasks
  const hasUnassigned = tasks.some((t) => t.assignee.status === "unassigned");

  return {
    workflow_name: workflowName,
    tasks,
    flows,
    checks: {
      is_dag: isDAG,
      has_unassigned: hasUnassigned,
      messages: [],
    },
  };
}

/**
 * Maps TaskType status to PromptTask status
 */
function mapTaskStatusToPromptStatus(
  taskStatus: "pending" | "progress" | "completed" | "done"
): "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DONE" {
  switch (taskStatus) {
    case "pending":
      return "PENDING";
    case "progress":
      return "IN_PROGRESS";
    case "completed":
      return "COMPLETED";
    case "done":
      return "DONE";
    default:
      return "PENDING";
  }
}

/**
 * Checks if the graph is a DAG (Directed Acyclic Graph)
 */
function checkIsDAG(nodes: Node<TaskType>[], edges: Edge[]): boolean {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjList = new Map<string, string[]>();

  // Build adjacency list
  nodeIds.forEach((id) => adjList.set(id, []));
  edges.forEach((edge) => {
    const neighbors = adjList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjList.set(edge.source, neighbors);
  });

  // DFS to detect cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      if (hasCycle(nodeId)) return false;
    }
  }

  return true;
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
