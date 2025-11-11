import type { ButtonHTMLAttributes } from 'react'

type ButtonSize = 'small' | 'medium' | 'large'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize
  className?: string
  children: string
  disabled?: boolean
}

export const Button = ({ size = 'medium', className, children, disabled, ...props }: ButtonProps) => {
  const sizeMap: Record<ButtonSize, string> = {
    small: 'px-2 py-1.5 text-xs rounded-lg',
    medium: 'px-3 py-2.5 text-sm rounded-lg',
    large: 'px-4 py-3 text-base rounded-lg',
  }

  const base =
    `flex items-center justify-center font-normal ${disabled ? "bg-gray-300" : "bg-black"} text-white rounded-lg ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`;


  const style = `${base} ${sizeMap[size]} ${className || ''}`.trim()

  return <button className={style} {...props}>{children}</button>
}
