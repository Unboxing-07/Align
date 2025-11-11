import { Plus } from "lucide-react"

type AddWorkspaceCardProps = {
  onClick?: () => void
}

export const AddWorkspaceCard = ({ onClick }: AddWorkspaceCardProps) => {
  return (
    <div
      className="w-full h-26 bg-white border border-dashed border-gray-200 rounded-2xl p-6 flex items-center justify-center cursor-pointer hover:shadow-blue/20 hover:shadow-4 transition-colors"
      onClick={onClick}
    >
      <Plus size={24} className="text-gray-200" />
    </div>
  )
}
