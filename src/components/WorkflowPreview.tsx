import { X, ArrowRight, Calendar, User, FileText } from "lucide-react"
import { Button } from "./Button"
import { LineButton } from "./LineButton"
import type { PromptWorkflow } from "../types/prompt"

interface WorkflowPreviewProps {
  workflow: PromptWorkflow
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export const WorkflowPreview = ({
  workflow,
  onConfirm,
  onCancel,
  isLoading = false
}: WorkflowPreviewProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-medium text-black">Generated Workflow Preview</h2>
          <button
            onClick={onCancel}
            className="text-gray-200 hover:text-black transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Workflow Name */}
          <div className="mb-6">
            <h3 className="text-2xl font-medium text-black mb-2">{workflow.workflow_name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-200">
              <span>{workflow.tasks.length} tasks</span>
              <span>{workflow.flows.length} dependencies</span>
            </div>
          </div>

          {/* Checks */}
          {workflow.checks.messages.length > 0 && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-300 font-medium mb-2">Validation Messages:</p>
              {workflow.checks.messages.map((msg, idx) => (
                <p key={idx} className="text-sm text-gray-200">• {msg}</p>
              ))}
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {workflow.tasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-black mb-1">{task.name}</h4>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-300">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="space-y-2">
                  {/* Assignee */}
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-gray-200" />
                    <span className="text-gray-300">
                      {task.assignee.status === "assigned" ? (
                        <>
                          <span className="text-black font-medium">{task.assignee.name}</span>
                          {task.assignee.role && (
                            <span className="text-gray-200"> ({task.assignee.role})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-200">Unassigned</span>
                      )}
                    </span>
                  </div>

                  {/* Deadline */}
                  {task.deadline && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-gray-200" />
                      <span className="text-gray-300">{task.deadline}</span>
                    </div>
                  )}

                  {/* Output */}
                  {task.output.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <FileText size={16} className="text-gray-200 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-gray-200">Output:</span>
                        <ul className="list-disc list-inside text-gray-300 ml-2">
                          {task.output.map((output, idx) => (
                            <li key={idx}>{output}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {task.notes && (
                    <div className="text-sm text-gray-200 italic">
                      Note: {task.notes}
                    </div>
                  )}

                  {/* Dependencies (incoming) */}
                  {workflow.flows.some(f => f.to === task.id) && (
                    <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-gray-100">
                      <ArrowRight size={16} className="text-gray-200" />
                      <span className="text-gray-200">Depends on:</span>
                      <div className="flex flex-wrap gap-1">
                        {workflow.flows
                          .filter(f => f.to === task.id)
                          .map(f => {
                            const fromTask = workflow.tasks.find(t => t.id === f.from)
                            return (
                              <span
                                key={f.from}
                                className="px-2 py-0.5 bg-blue/10 text-blue text-xs rounded"
                              >
                                {fromTask?.name || f.from}
                              </span>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <LineButton onClick={onCancel} disabled={isLoading}>
            Cancel
          </LineButton>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !workflow.checks.is_dag}
            size="medium"
          >
            {isLoading ? "Creating..." : "Create Workflow"}
          </Button>
        </div>
      </div>
    </div>
  )
}
