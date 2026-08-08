import { ReactNode } from 'react'

type Tone = 'emerald' | 'rose' | 'amber' | 'sky' | 'slate'

const tones: Record<Tone, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

const Badge = ({
  tone = 'slate',
  size = 'sm',
  className = '',
  children,
}: {
  tone?: Tone
  size?: 'sm' | 'md'
  className?: string
  children?: ReactNode
}) => {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${tones[tone]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
