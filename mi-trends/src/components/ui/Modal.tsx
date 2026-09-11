"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { backdropVariants, modalVariants } from "@/lib/motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close, and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-sm bg-white shadow-card-hover outline-none",
              sizeMap[size],
              className,
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-6 border-b border-hairline p-6">
                <div>
                  {title && (
                    <h2 className="font-serif text-2xl text-ink">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-2 text-body-sm text-muted">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}
            {!title && !description && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute right-4 top-4 z-20 cursor-pointer rounded-sm bg-white/90 p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

/** Every destructive admin action routes through this. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-6">
        <p className="text-body-sm text-muted">{message}</p>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 cursor-pointer rounded-sm border border-ink/15 px-6 text-label uppercase tracking-[0.1em] transition-colors hover:bg-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-12 cursor-pointer rounded-sm bg-danger px-6 text-label uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#B91C1C] disabled:opacity-50"
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
