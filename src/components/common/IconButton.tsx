import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  title?: string
  icon: React.ReactNode
  variant?: 'ghost' | 'primary' | 'danger' | 'neutral'
}

const classes: Record<string, string> = {
  ghost: 'rounded-full border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
  primary: 'rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500',
  danger: 'rounded-full bg-rose-500 p-2 text-white hover:bg-rose-400 dark:bg-rose-600 dark:hover:bg-rose-500',
  neutral: 'rounded-full bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
}

export default function IconButton({ title, icon, variant = 'ghost', className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      title={title}
      aria-label={title}
      className={`${classes[variant]} ${className}`.trim()}
    >
      <span className="flex items-center justify-center">{icon}</span>
    </button>
  )
}
