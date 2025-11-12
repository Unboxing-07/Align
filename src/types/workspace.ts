import type { TaskType } from "./task";

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

export type WorkflowType = {
  id: string;
  name: string;
  doneNodeCount?: number;
  totalNodeCount?: number;
  nodes: any[];
  edges: any[];
};
