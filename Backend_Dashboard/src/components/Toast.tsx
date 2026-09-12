import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext, type ToastTone } from '../hooks/toastContext'

interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-sage bg-sage-soft text-ink',
  error: 'border-rust bg-rust-soft text-ink',
  info: 'border-border bg-bone-soft text-ink',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-[toast-in_0.2s_ease-out] rounded-xl border px-4 py-3 text-sm shadow-lg ${TONE_CLASSES[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
