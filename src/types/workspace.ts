import type { TaskType } from "./task";

export type AssigneeType = {
  name: string;
  email: string;
  role: string;
};

export type WorkspaceType = {
  id: string;
  name: string;
  assigneeList: AssigneeType[];
  workflow: WorkflowType[];
};

export type WorkflowType = {
  id: string;
  name: string;
  doneNodeCount: number;
  totalNodeCount: number;
  nodes: { id: string; data: TaskType }[];
  edges: { id: string; from: string; to: string }[];
};
