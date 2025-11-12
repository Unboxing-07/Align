import { useState } from "react"
import { Input } from "./Input"
import { Button } from "./Button"
import { X } from "lucide-react"

type CreateWorkspaceModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export const CreateWorkspaceModal = ({ isOpen, onClose, onCreate }: CreateWorkspaceModalProps) => {
  const [workspaceName, setWorkspaceName] = useState("")

  if (!isOpen) return null

  const handleCreate = () => {
    if (workspaceName.trim()) {
      onCreate(workspaceName)
      setWorkspaceName("")
      onClose()
    }
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
      <div className="bg-white rounded-2xl p-7 flex flex-col gap-12 w-[360px]">
        <div className="flex flex-col gap-2">
          <div className="relative flex justify-center items-center">
            <h2 className="text-black text-lg font-medium text-center">
              Create new workspace
            </h2>
            <div
              onClick={onClose}
              className="absolute right-0"
            >
              <X size={20} />
            </div>
          </div>

          <Input
            placeholder="workspace name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>

        <Button
          size="small"
          className="w-full"
          onClick={handleCreate}
          disabled={!workspaceName.trim()}
        >
          Create new workspace
        </Button>
      </div>
    </div>
  )
}
