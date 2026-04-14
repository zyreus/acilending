import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, variant = 'info') => {
    setToast({ message, variant, id: Date.now() })
    window.setTimeout(() => setToast(null), 4200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="pointer-events-none fixed bottom-6 right-6 z-[200] max-w-sm"
          role="status"
        >
          <div
            className={[
              'pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
              toast.variant === 'error'
                ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-950/95 dark:text-red-50'
                : toast.variant === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/95 dark:text-emerald-50'
                  : 'border-gray-200 bg-white text-gray-900 shadow-lg dark:border-white/15 dark:bg-[#111827] dark:text-gray-100',
            ].join(' ')}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { showToast: () => {} }
  return ctx
}
