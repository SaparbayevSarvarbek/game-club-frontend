import { ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  maxWidth?: string
  footer?: ReactNode
  children?: ReactNode
}

const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = 'max-w-lg',
  footer,
  children,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 sm:items-center">
      <div
        className={`my-4 max-h-[calc(100vh-2rem)] w-full overflow-y-auto overscroll-contain rounded-3xl bg-white shadow-xl dark:bg-slate-950 ${maxWidth}`}
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
              className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Yopish"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex flex-col gap-3 border-t border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
