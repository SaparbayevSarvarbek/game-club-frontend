import { ReactNode } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  maxWidth?: string
  children?: ReactNode
}

const Drawer = ({
  open,
  onClose,
  title,
  subtitle,
  footer,
  maxWidth = 'max-w-lg sm:max-w-xl',
  children,
}: DrawerProps) => {
  if (!open) return null

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/40" onClick={onClose} aria-label="Yopish" />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-950 animate-slide-in ${maxWidth}`}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              {title && <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Yopish
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-slate-200 p-5 dark:border-slate-800">{footer}</div>}
      </aside>
    </>
  )
}

export default Drawer
