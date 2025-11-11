type AssigneeProps = {
  email: string;
  ringed?: boolean;
}

export const Assignee = ({ email, ringed }: AssigneeProps) => {
  return (
    <div
      className={`size-8 rounded-full bg-blue flex justify-center items-center text-white text-base ${ringed ? "ring-[3px] ring-white" : ""}`}
    >
      {email.charAt(0).toUpperCase()}
    </div>
  )
}