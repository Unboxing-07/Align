type MyTaskCardProps = {
  title: string
  description: string
  workflowName: string
  deadline: Date | string
  status: "pending" | "progress" | "completed" | "done"
  onClick?: () => void
}

export const MyTaskCard = ({
  title,
  description,
  workflowName,
  deadline,
  status,
  onClick,
}: MyTaskCardProps) => {
  const formatDeadline = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return "No deadline"
      }
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(dateObj)
        .replace(/\//g, ".")
    } catch {
      return "No deadline"
    }
  }

  // Get status-based shadow (same as TaskNode)
  const getStatusShadow = () => {
    switch (status) {
      case 'progress':
        return 'shadow-[0px_0px_4px_2px_rgba(255,174,0,0.50)]';
      case 'completed':
        return 'shadow-[0px_0px_4px_2px_rgba(43,52,217,0.50)]';
      case 'done':
        return 'shadow-[0px_0px_4px_2px_rgba(0,132,26,0.50)]';
      default: // pending
        return 'shadow-md';
    }
  }

  return (
    <div
      className={`w-196 h-26 bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between cursor-pointer hover:border-blue hover:shadow-lg hover:shadow-blue/10 active:scale-[0.99] transition-all duration-200 ${getStatusShadow()}`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1 w-135">
        <p className="text-black text-lg truncate">{title}</p>
        <p className="text-gray-200 text-xs line-clamp-2">{description}</p>
      </div>

      <div className="flex flex-col gap-1 items-end text-gray-200 text-xs whitespace-nowrap">
        <p className="text-right">{workflowName}</p>
        <p>deadline: {formatDeadline(deadline)}</p>
      </div>
    </div>
  )
}
