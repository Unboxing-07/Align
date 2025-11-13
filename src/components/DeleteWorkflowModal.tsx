import { Button } from "./Button"
import { X } from "lucide-react"

type DeleteWorkflowModalProps = {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  workflowName: string
}

export const DeleteWorkflowModal = ({ isOpen, onClose, onDelete, workflowName }: DeleteWorkflowModalProps) => {
  if (!isOpen) return null

  const handleDelete = () => {
    onDelete()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-7 flex flex-col gap-12 w-[400px]">
        <div className="flex flex-col gap-4">
          <div className="relative flex justify-center items-center">
            <h2 className="text-black text-lg font-medium text-center">
              Delete workflow
            </h2>
            <div
              onClick={onClose}
              className="absolute right-0 cursor-pointer"
            >
              <X size={20} />
            </div>
          </div>

          <p className="text-gray-300 text-center">
            Are you sure you want to delete
            <br />
            <span className="font-medium text-black">"{workflowName}"</span>?
            <br />
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            size="small"
            className="flex-1 !bg-red-500 hover:!bg-red-600"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
