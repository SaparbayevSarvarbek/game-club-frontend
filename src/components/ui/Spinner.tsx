const Spinner = ({
  size = 'md',
  label,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
}) => {
  const dims = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
      <span
        className={`${dims[size]} animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400`}
      />
      {label && <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  )
}

export default Spinner
