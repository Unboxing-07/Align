import type { TaskType } from "../types/task";
import { Assignee } from "./Assignee";

type TaskNodeProps = {
  task: TaskType;
};

export const TaskNode = ({ task }: TaskNodeProps) => {
  // Format deadline
  const formatDeadline = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "No deadline";
      }
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(dateObj);
    } catch {
      return "No deadline";
    }
  };

  return (
    <div className="w-[284px] h-[154px] bg-white border-2 border-gray-100 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <div className="w-full h-full p-4 flex flex-col">
        {/* Title */}
        <h3 className="text-black text-base font-semibold mb-2 truncate">
          {task.title}
        </h3>

        {/* Description */}
        <p className="text-gray-200 text-sm leading-tight mb-3 overflow-hidden line-clamp-2 flex-1">
          {task.description}
        </p>

        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          {/* Assignee Section */}
          <div className="flex gap-2 items-center min-w-0">
            {/* Avatar */}
            <Assignee email={task.assignee.email} />

            {/* Assignee Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-black text-sm font-medium truncate">{task.assignee.name}</p>
              <p className="text-gray-200 text-xs truncate">{task.assignee.role}</p>
            </div>
          </div>

          {/* Deadline */}
          <div className="text-gray-200 text-xs whitespace-nowrap ml-2">
            {formatDeadline(task.deadline)}
          </div>
        </div>
      </div>
    </div>
  );
};
