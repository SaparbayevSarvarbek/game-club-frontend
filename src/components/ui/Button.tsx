import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500/60 disabled:hover:bg-emerald-600',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-emerald-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  ghost:
    'text-slate-700 hover:bg-slate-100 focus-visible:ring-emerald-500/60 dark:text-slate-200 dark:hover:bg-slate-800',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500/60 disabled:hover:bg-rose-600',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}

export default Button
