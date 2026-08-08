import { ReactNode } from 'react'

const EmptyState = ({
  icon,
  title,
  message,
  className = '',
}: {
  icon?: ReactNode
  title?: ReactNode
  message?: ReactNode
  className?: string
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 py-10 text-center ${className}`}>
      {icon && <span className="mb-1 text-slate-300 dark:text-slate-600">{icon}</span>}
      {title && <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>}
      {message && <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>}
    </div>
  )
}

export default EmptyState
