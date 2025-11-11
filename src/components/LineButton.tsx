import type { ButtonHTMLAttributes } from 'react'

interface LineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  gray?: boolean
}

export const LineButton = ({ children, gray, ...props }: LineButtonProps) => {
  return <button {...props} className={`px-3 py-1.5 rounded-sm border border-gray-100 text-sm ${gray ? "text-gray-200" : "text-black"}`}>{children}</button>
}