"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION_MS = 3000;

const kindConfig: Record<
  ToastKind,
  { icon: typeof CheckCircle2; accent: string; bar: string }
> = {
  success: { icon: CheckCircle2, accent: "text-success", bar: "bg-success" },
  error: { icon: AlertCircle, accent: "text-danger", bar: "bg-danger" },
  info: { icon: Info, accent: "text-accent", bar: "bg-accent" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { ...input, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS),
      );
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ kind: "success", title, description }),
      error: (title, description) => toast({ kind: "error", title, description }),
      info: (title, description) => toast({ kind: "info", title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-32px)] max-w-sm flex-col gap-3 md:right-6 md:top-6"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, accent, bar } = kindConfig[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 48 }}
                transition={{ duration: 0.3, ease: EASE_TACTILE }}
                className="card-surface pointer-events-auto relative overflow-hidden"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3 p-4">
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", accent)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-ink">{t.title}</p>
                    {t.description && (
                      <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="cursor-pointer rounded-sm p-1 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {/* Shrinking progress bar tracks the auto-dismiss timer. */}
                <motion.div
                  className={cn("absolute bottom-0 left-0 h-0.5", bar)}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: DURATION_MS / 1000, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
