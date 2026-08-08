import { ReactNode } from 'react'

type Tone = 'emerald' | 'rose' | 'amber' | 'sky' | 'slate' | 'indigo' | 'violet' | 'teal'

interface StatCardProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  subtitle?: ReactNode
  tone?: Tone
  gradient?: boolean
  onClick?: () => void
  className?: string
  valueClassName?: string
}

const softBg: Record<Tone, string> = {
  emerald: 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800',
  rose: 'bg-rose-50 border border-rose-200 dark:bg-rose-900/40 dark:border-rose-800',
  amber: 'bg-amber-50 border border-amber-200 dark:bg-amber-900/40 dark:border-amber-800',
  sky: 'bg-sky-50 border border-sky-200 dark:bg-sky-900/40 dark:border-sky-800',
  slate: 'bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700',
  indigo: 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/40 dark:border-indigo-800',
  violet: 'bg-violet-50 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800',
  teal: 'bg-teal-50 border border-teal-200 dark:bg-teal-900/40 dark:border-teal-800',
}

const gradBg: Record<Tone, string> = {
  emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
  rose: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white',
  amber: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
  sky: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
  slate: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white',
  indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
  violet: 'bg-gradient-to-br from-violet-500 to-purple-700 text-white',
  teal: 'bg-gradient-to-br from-teal-500 to-teal-700 text-white',
}

const iconSoft: Record<Tone, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200',
}

const labelSoft: Record<Tone, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-300',
  rose: 'text-rose-600 dark:text-rose-300',
  amber: 'text-amber-600 dark:text-amber-300',
  sky: 'text-sky-600 dark:text-sky-300',
  slate: 'text-slate-500 dark:text-slate-400',
  indigo: 'text-indigo-600 dark:text-indigo-300',
  violet: 'text-violet-600 dark:text-violet-300',
  teal: 'text-teal-600 dark:text-teal-300',
}

const StatCard = ({
  label,
  value,
  icon,
  subtitle,
  tone = 'slate',
  gradient = false,
  onClick,
  className = '',
  valueClassName = '',
}: StatCardProps) => {
  const bg = gradient ? gradBg[tone] : softBg[tone]
  const isWhite = gradient
  const Comp: any = onClick ? 'button' : 'div'

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex flex-col rounded-2xl p-5 text-left shadow-sm ${bg} ${onClick ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''} ${className}`}
    >
      <span className={`text-xs font-semibold uppercase tracking-wider ${isWhite ? 'text-white/85' : labelSoft[tone]}`}>
        {label}
      </span>
      <span className="mt-4 flex items-center justify-between gap-3">
        {icon && (
          <span
            className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isWhite ? 'bg-white/20 text-white' : iconSoft[tone]
            }`}
          >
            {icon}
          </span>
        )}
        <span
          className={`break-words font-semibold leading-none ${valueClassName || 'text-3xl'} ${
            isWhite ? 'text-white' : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {value}
        </span>
      </span>
      {subtitle && (
        <span className={`mt-3 text-sm ${isWhite ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
          {subtitle}
        </span>
      )}
    </Comp>
  )
}

export default StatCard
