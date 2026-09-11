"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/context/SettingsContext";
import { EASE_TACTILE } from "@/lib/motion";
import type { AppliedCoupon, CartItem } from "@/types";

interface CouponFieldProps {
  items: CartItem[];
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon | null) => void;
}

export function CouponField({ items, applied, onApply }: CouponFieldProps) {
  const toast = useToast();
  const formatCurrency = useCurrency();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setChecking(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.applied) {
        toast.error("Code not applied", data.error ?? "Please check the code.");
        return;
      }

      onApply(data.applied as AppliedCoupon);
      setCode("");
      toast.success("Discount applied", `${data.applied.code} is now active.`);
    } catch {
      toast.error("Couldn't check that code", "Please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {applied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_TACTILE }}
            className="flex items-center justify-between gap-4 rounded-sm border border-success/25 bg-success/5 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Tag className="h-4 w-4 shrink-0 text-success" aria-hidden />
              <div className="min-w-0">
                <span className="block truncate text-body-sm font-medium text-ink">
                  {applied.code}
                </span>
                <span className="text-caption normal-case tracking-normal text-muted">
                  −{formatCurrency(applied.discount)} applied
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onApply(null)}
              aria-label="Remove discount code"
              className="shrink-0 cursor-pointer rounded-sm p-1.5 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="entry"
            onSubmit={apply}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE_TACTILE }}
            className="flex gap-2"
          >
            <label htmlFor="coupon" className="sr-only">
              Discount code
            </label>
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Discount code"
              autoComplete="off"
              className="h-12 flex-1 rounded-sm border border-ink/15 bg-white px-4 text-body-sm uppercase tracking-[0.05em] text-ink outline-none transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/60 focus:border-accent"
            />
            <Button
              type="submit"
              variant="secondary"
              loading={checking}
              disabled={!code.trim()}
              className="h-12"
            >
              Apply
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
