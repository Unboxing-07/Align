import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronDown, PenLine } from "lucide-react";
import type { TaskType } from "../types/task";
import type { AssigneeType } from "../types/workspace";
import { Assignee } from "./Assignee";

type TaskDetailPanelProps = {
  task: TaskType;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (task: TaskType, shouldReload?: boolean) => void;
  previousNodeOutput?: string;
  workspaceMembers?: AssigneeType[];
};

export const TaskDetailPanel = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  previousNodeOutput = "",
  workspaceMembers = [],
}: TaskDetailPanelProps) => {
  const [editedTask, setEditedTask] = useState(task);
  const [originalTask, setOriginalTask] = useState(task);
  const [isEditMode, setIsEditMode] = useState(false);
  const [noOutput, setNoOutput] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const outputSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update tasks when prop changes
  useEffect(() => {
    setEditedTask(task);
    setOriginalTask(task);
  }, [task]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (outputSaveTimeout.current) {
        clearTimeout(outputSaveTimeout.current);
      }
    };
  }, []);

  // Check if output can be edited (only in progress or completed status)
  const canEditOutput = editedTask.status === 'progress' || editedTask.status === 'completed';

  // Check if Done button should be enabled (only in completed status)
  const canMarkAsDone = editedTask.status === 'completed';

  const formatDeadline = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "No deadline";
      }
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(dateObj).replace(/\//g, ".");
    } catch {
      return "No deadline";
    }
  };

  const formatDateForInput = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return "";
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - restore original task
      setEditedTask(originalTask);
      setIsEditMode(false);
      setShowAssigneeDropdown(false);
    } else {
      // Enter edit mode
      setIsEditMode(true);
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      // Auto-transition to completed if output is written
      let finalTask = editedTask;
      if (editedTask.output && editedTask.output.trim() && editedTask.status === 'progress') {
        finalTask = { ...editedTask, status: 'completed' };
      }
      onUpdate(finalTask);
      setOriginalTask(finalTask);
      setEditedTask(finalTask);
    }
    setIsEditMode(false);
    setShowAssigneeDropdown(false);
  };

  const handleOutputChange = useCallback((value: string) => {
    // Update edited task with new output value
    setEditedTask((prev) => ({ ...prev, output: value }));

    // Clear previous timeout
    if (outputSaveTimeout.current) {
      clearTimeout(outputSaveTimeout.current);
    }

    // Debounce auto-save (wait 1 second after user stops typing)
    outputSaveTimeout.current = setTimeout(() => {
      if (onUpdate) {
        setEditedTask((currentTask) => {
          // Auto-transition to completed if output is written and task is in progress
          const shouldTransitionToCompleted =
            value && value.trim() && currentTask.status === 'progress';

          const finalTask = shouldTransitionToCompleted
            ? { ...currentTask, output: value, status: 'completed' as const }
            : { ...currentTask, output: value };

          onUpdate(finalTask, false); // Don't reload on auto-save
          setOriginalTask(finalTask);
          return finalTask;
        });
      }
    }, 1000);
  }, [onUpdate]);

  const handleDone = () => {
    if (onUpdate) {
      onUpdate({ ...editedTask, status: "done" }, true); // shouldReload = true
    }
    onClose();
  };

  const handleAssigneeSelect = (member: AssigneeType) => {
    setEditedTask({
      ...editedTask,
      assignee: member,
    });
    setShowAssigneeDropdown(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[648px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto p-6">
          {/* Title Section with Edit/Cancel Button */}
          <div className="flex items-center justify-between mb-4">
            {isEditMode ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                className="text-2xl text-black font-normal outline-none flex-1 mr-4"
                placeholder="Title"
              />
            ) : (
              <h2 className="text-2xl text-black font-normal flex-1 mr-4">
                {editedTask.title}
              </h2>
            )}
            <button
              onClick={handleEditToggle}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center shrink-0"
            >
              {isEditMode ? (
                <X size={24} className="text-black" />
              ) : (
                <PenLine size={24} className="text-black" />
              )}
            </button>
          </div>

          {/* Description */}
          {isEditMode ? (
            <textarea
              value={editedTask.description}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              className="w-full h-[200px] text-xl text-gray-200 resize-none outline-none mb-4"
              placeholder="Description of this task"
            />
          ) : (
            <p className="w-full h-[200px] text-xl text-gray-200 overflow-y-auto mb-4 whitespace-pre-wrap">
              {editedTask.description}
            </p>
          )}

          {/* Assignee */}
          <div className="relative w-full mb-4">
            <button
              onClick={() => isEditMode && setShowAssigneeDropdown(!showAssigneeDropdown)}
              disabled={!isEditMode}
              className={`w-full h-12 border border-gray-100 rounded-lg px-4 flex items-center ${
                isEditMode ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
              }`}
            >
              <Assignee email={editedTask.assignee.email} />
              <span className="ml-3 text-black text-base flex-1 text-left">
                {editedTask.assignee.name} - {editedTask.assignee.role}
              </span>
              {isEditMode && (
                <ChevronDown
                  size={24}
                  className="ml-auto text-black shrink-0"
                />
              )}
            </button>

            {/* Assignee Dropdown */}
            {showAssigneeDropdown && isEditMode && workspaceMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {workspaceMembers.map((member) => (
                  <button
                    key={member.userId || member.email}
                    onClick={() => handleAssigneeSelect(member)}
                    className="w-full px-4 py-3 flex items-center hover:bg-gray-50 text-left"
                  >
                    <Assignee email={member.email} />
                    <span className="ml-3 text-black text-base">
                      {member.name} - {member.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-6" />

          {/* INPUT Section */}
          <div className="mb-4">
            <label className="block text-black text-base mb-2">INPUT</label>
            <div className="w-full min-h-12 border border-gray-100 rounded-lg px-4 py-3 flex items-center">
              {previousNodeOutput ? (
                <p className="text-black text-base whitespace-pre-wrap break-words">
                  {previousNodeOutput}
                </p>
              ) : (
                <span className="text-gray-200 text-base">(no inputed)</span>
              )}
            </div>
          </div>

          {/* OUTPUT Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-black text-base">OUTPUT</label>
              {canEditOutput && (
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-200 text-xs">
                    No output, But completed this task
                  </span>
                  <button
                    onClick={() => setNoOutput(!noOutput)}
                    className={`w-5 h-5 border border-gray-100 rounded ${
                      noOutput ? "bg-blue" : "bg-white"
                    }`}
                  />
                </div>
              )}
            </div>
            {canEditOutput ? (
              <textarea
                value={editedTask.output}
                onChange={(e) => handleOutputChange(e.target.value)}
                className="w-full h-36 border border-gray-100 rounded-lg px-3.5 py-3 text-sm text-gray-200 resize-none outline-none"
                placeholder="ex) Rule Book, Swagger Link, Figma Link...."
              />
            ) : (
              <div className="w-full min-h-36 border border-gray-100 rounded-lg px-3.5 py-3 bg-gray-50">
                <p className="text-sm text-gray-200 whitespace-pre-wrap">
                  {editedTask.output || "Output locked - Task must be in progress or completed"}
                </p>
              </div>
            )}
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <label className="block text-black text-base mb-2">DEADLINE</label>
            {isEditMode ? (
              <input
                type="date"
                value={formatDateForInput(editedTask.deadline)}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : editedTask.deadline;
                  setEditedTask({ ...editedTask, deadline: newDate });
                }}
                className="w-full h-12 border border-gray-100 rounded-lg px-4 text-base text-black outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 transition-all duration-200"
              />
            ) : (
              <div className="w-full h-12 border border-gray-100 rounded-lg px-4 flex items-center bg-gray-50">
                <p className="text-base text-black">{formatDeadline(editedTask.deadline)}</p>
              </div>
            )}
          </div>

          {/* Done/Save Button */}
          <button
            onClick={isEditMode ? handleSave : handleDone}
            disabled={!isEditMode && !canMarkAsDone}
            className={`w-full h-12 text-white text-base rounded transition-opacity ${
              !isEditMode && !canMarkAsDone
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-gray-300 hover:bg-opacity-90"
            }`}
          >
            {isEditMode ? "Save" : "Done"}
          </button>

          {/* Status indicator */}
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-200">
              Status: <span className="font-semibold capitalize">{editedTask.status}</span>
              {!isEditMode && !canMarkAsDone && " (Complete output to mark as done)"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
