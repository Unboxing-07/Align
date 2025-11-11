interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  width?: string | number
}

export const Input = ({ width, className = "", style, ...props }: InputProps) => {
  const base = `h-9 rounded-lg bg-white border border-gray-100 placeholder:text-gray-200 text-sm text-black px-3 outline-none`
  const widthClass = typeof width === 'string' ? width : ''
  const widthStyle = typeof width === 'number' ? { width: `${width}px` } : {}

  return <input
    type="text"
    className={`${base} ${widthClass || 'w-92.5'} ${className}`.trim()}
    style={{ ...widthStyle, ...style }}
    {...props}
  />
}