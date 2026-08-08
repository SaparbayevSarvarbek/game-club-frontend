import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  padded?: boolean
  children?: ReactNode
}

const Card = ({
  title,
  subtitle,
  actions,
  padded = true,
  className = '',
  children,
  ...props
}: CardProps) => {
  const hasHeader = !!(title || actions)
  return (
    <div className={`rounded-3xl bg-white shadow-soft dark:bg-slate-900 ${padded ? 'p-6' : ''} ${className}`} {...props}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children != null && <div className={hasHeader ? 'mt-4' : ''}>{children}</div>}
    </div>
  )
}

export default Card
