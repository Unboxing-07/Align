import type { ButtonHTMLAttributes } from 'react'

interface LineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  gray?: boolean
  isThin?: boolean;
}

export const LineButton = ({ children, gray, isThin = false, ...props }: LineButtonProps) => {
  return <button {...props} className={`h-fit px-3 ${isThin ? "py-1" : "py-1.5"} rounded-sm border border-gray-100 text-sm cursor-pointer hover:bg-black/10 transition-colors ${gray ? "text-gray-200" : "text-black"}`}>{children}</button>
}