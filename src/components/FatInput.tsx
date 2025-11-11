interface FatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  width?: string | number
}

export const FatInput = ({ width, className = "", style, ...props }: FatInputProps) => {
  const base = `h-12 rounded-lg bg-white border border-gray-100 placeholder:text-gray-200 text-sm text-black px-3.5 outline-none`
  const widthClass = typeof width === 'string' ? width : ''
  const widthStyle = typeof width === 'number' ? { width: `${width}px` } : {}

  return <input
    type="text"
    className={`${base} ${widthClass || 'w-92.5'} ${className}`.trim()}
    style={{ ...widthStyle, ...style }}
    {...props}
  />
}