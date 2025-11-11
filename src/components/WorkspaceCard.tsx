import { Assignee } from "./Assignee"

type WorkspaceCardProps = {
  name: string
  remainingWorkflows: number
  assignees: string[]
  onClick?: () => void
}

export const WorkspaceCard = ({ name, remainingWorkflows, assignees, onClick }: WorkspaceCardProps) => {
  return (
    <div
      className="w-full h-26 bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:shadow-blue/20 hover:shadow-4 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <p className="text-black text-lg">{name}</p>
        <p className="text-gray-200 text-xs">
          Here are {remainingWorkflows} remaining, uncompleted workflows.
        </p>
      </div>
      <div className="flex items-center pr-1.5">
        {assignees.slice(0, 3).map((email, index) => (
          <div key={index} className="-mr-1.5">
            <Assignee email={email} ringed />
          </div>
        ))}
      </div>
    </div>
  )
}
