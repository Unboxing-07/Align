import type { AssigneeType } from "./workspace";

export type TaskStatusType = "pending" | "progress" | "completed" | "done";

export type TaskType = {
  title: string;
  description: string;
  assignee: AssigneeType;
  input: string;
  output: string;
  deadline: Date;
  status: TaskStatusType;
};
