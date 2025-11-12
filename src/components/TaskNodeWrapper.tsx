import type { NodeProps } from "@xyflow/react";
import type { TaskType } from "../types/task";
import { TaskNode } from "./TaskNode";

export const TaskNodeWrapper = (props: NodeProps) => {
  const task = props.data as TaskType;
  return <TaskNode task={task} />;
};
