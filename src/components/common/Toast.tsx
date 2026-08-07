import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>')
  return ctx
}

// Module-level emitter so code outside the React tree (e.g. the axios
// interceptor) can trigger toasts. Registered by <ToastProvider> on mount.
let emitToast: ((type: ToastType, message: string) => void) | null = null

export const toast = {
  success: (message: string) => emitToast?.('success', message),
  error: (message: string) => emitToast?.('error', message),
  info: (message: string) => emitToast?.('info', message),
}

let idCounter = 0

const AUTO_DISMISS_MS = 4500

const icons = { success: CheckCircleIcon, error: XCircleIcon, info: InformationCircleIcon }
const colors: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-rose-500',
  info: 'text-sky-500',
}
const borders: Record<ToastType, string> = {
  success: 'border-emerald-200 dark:border-emerald-900',
  error: 'border-rose-200 dark:border-rose-900',
  info: 'border-sky-200 dark:border-sky-900',
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<number, number>>({})

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, type, message }])
      timers.current[id] = window.setTimeout(() => remove(id), AUTO_DISMISS_MS)
    },
    [remove],
  )

  useEffect(() => {
    emitToast = push
    return () => {
      emitToast = null
    }
  }, [push])

  const api = { success: (m: string) => push('success', m), error: (m: string) => push('error', m), info: (m: string) => push('info', m) }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((t) => {
          const Icon = icons[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-soft dark:bg-slate-900 animate-toast-in ${borders[t.type]}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colors[t.type]}`} />
              <p className="flex-1 break-words text-sm text-slate-800 dark:text-slate-100">{t.message}</p>
              <button type="button" onClick={() => remove(t.id)} className="shrink-0 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200" aria-label="Yopish">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
