type WorkflowCardProps = {
  name: string
  doneCount: number
  totalCount: number
  onClick?: () => void
}

export const WorkflowCard = ({ name, doneCount, totalCount, onClick }: WorkflowCardProps) => {
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0
  const isInProgress = totalCount === 0

  return (
    <div
      className="w-full h-15 bg-white border border-gray-100 rounded p-4 flex items-center justify-between cursor-pointer hover:border-gray-200 transition-colors"
      onClick={onClick}
    >
      <p className="text-black text-base">{name}</p>

      <div className="flex flex-col items-end gap-1">
        {isInProgress ? (
          <p className="text-gray-200 text-xs">In Progress</p>
        ) : (
          <p className="text-gray-200 text-xs">
            {doneCount} / {totalCount} Done
          </p>
        )}
        <div className="w-45 h-1 bg-gray-200 rounded relative overflow-hidden">
          <div
            className="absolute top-0 right-0 h-full bg-blue rounded transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
