import { Assignee } from "./Assignee"
import { Trash2 } from "lucide-react"

type MemberItemProps = {
  email: string
  name: string
  role: string
  onDelete?: () => void
}

export const MemberItem = ({ email, name, role, onDelete }: MemberItemProps) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <Assignee email={email} />

      <div className="flex-1 flex items-center gap-1 text-xl">
        <p className="text-black">{email}</p>
        <p className="text-gray-100">/</p>
        <p className="text-black">{name}</p>
        <p className="text-gray-100">/</p>
        <p className="text-black">{role}</p>
      </div>

      <button
        onClick={onDelete}
        className="text-gray-200 hover:text-black transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  )
}
