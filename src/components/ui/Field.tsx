import { ReactNode } from 'react'

const base =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900'

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  as?: 'input' | 'select' | 'textarea'
  /* Forwards value/onChange/onBlur/onFocus/type/inputMode/min/required/placeholder/disabled,
     so formatNumberInput / parseNumberInput normalization keeps working on blur/focus. */
  inputProps?: any
  children?: ReactNode
}

const Field = ({ label, hint, error, className = '', as = 'input', inputProps, children }: FieldProps) => {
  const control =
    as === 'select' ? (
      <select className={base} {...inputProps}>
        {children}
      </select>
    ) : as === 'textarea' ? (
      <textarea className={base} {...inputProps} />
    ) : (
      <input className={base} {...inputProps} />
    )

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}
      {control}
      {hint && <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  )
}

export default Field
