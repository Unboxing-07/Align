import type { TaskType } from "./task";
import type { Node, Edge } from "@xyflow/react";

export type AssigneeType = {
  userId?: string;
  inviteId?: string;
  name: string;
  email: string;
  role: string;
  isPending?: boolean;
};

export type WorkspaceType = {
  id: string;
  name: string;
  assigneeList: AssigneeType[];
  workflow: WorkflowType[];
};

export type TaskNode = Node<TaskType>;

export type WorkflowType = {
  id: string;
  name: string;
  doneNodeCount?: number;
  totalNodeCount?: number;
  nodes: TaskNode[];
  edges: Edge[];
};
