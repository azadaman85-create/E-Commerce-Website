"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PackageOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/context/SettingsContext";
import {
  RETURN_REASONS,
  RETURN_STATUS_LABELS,
  RETURN_STATUS_TONE,
  type ReturnEligibility,
} from "@/lib/returns";
import { formatDate } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { OrderItem, ReturnRequest as ReturnRecord } from "@/types";

interface Props {
  orderId: string;
  items: OrderItem[];
  eligibility: ReturnEligibility;
  existing: ReturnRecord | null;
}

export function ReturnRequest({ orderId, items, eligibility, existing }: Props) {
  const router = useRouter();
  const toast = useToast();
  const formatCurrency = useCurrency();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(RETURN_REASONS[0]);
  const [comment, setComment] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const selected = Object.entries(quantities).filter(([, q]) => q > 0);
  const refundEstimate = selected.reduce((sum, [id, qty]) => {
    const line = items.find((i) => i.id === id);
    return sum + (line ? Number(line.unit_price) * qty : 0);
  }, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (selected.length === 0) {
      toast.error("Choose what you're returning", "Select at least one item.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason,
          comment: comment.trim() || undefined,
          items: selected.map(([orderItemId, quantity]) => ({
            orderItemId,
            quantity,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Couldn't submit your return", data.error ?? "Please try again.");
        return;
      }

      setOpen(false);
      toast.success(
        "Return requested",
        "We'll email you a prepaid label within one business day.",
      );
      router.refresh();
    } catch {
      toast.error("Couldn't submit your return", "Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  // An existing request replaces the button with its current state.
  if (existing) {
    return (
      <div className="card-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <PackageOpen className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
            <h3 className="text-label uppercase tracking-[0.1em] text-ink">Return</h3>
          </div>
          <Badge tone={RETURN_STATUS_TONE[existing.status]}>
            {RETURN_STATUS_LABELS[existing.status]}
          </Badge>
        </div>

        <p className="mt-4 text-body-sm text-muted">
          Requested {formatDate(existing.created_at)} · {existing.reason}
        </p>

        <ul className="mt-4 flex flex-col gap-1">
          {existing.items.map((item) => (
            <li
              key={item.order_item_id}
              className="text-caption normal-case tracking-normal text-muted"
            >
              {item.quantity} × {item.title}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-body-sm text-ink">
          Estimated refund {formatCurrency(Number(existing.refund_amount))}
        </p>

        {existing.admin_note && (
          <p className="mt-4 rounded-sm bg-cream px-4 py-3 text-body-sm text-muted">
            {existing.admin_note}
          </p>
        )}
      </div>
    );
  }

  if (!eligibility.eligible) {
    return (
      <div className="card-surface p-6">
        <h3 className="text-label uppercase tracking-[0.1em] text-ink">Returns</h3>
        <p className="mt-3 text-body-sm text-muted">{eligibility.reason}</p>
      </div>
    );
  }

  return (
    <>
      <div className="card-surface p-6">
        <h3 className="text-label uppercase tracking-[0.1em] text-ink">Returns</h3>
        <p className="mt-3 text-body-sm text-muted">
          {eligibility.daysLeft} day{eligibility.daysLeft === 1 ? "" : "s"} left to
          return this order.
        </p>
        <div className="mt-5">
          <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Request a return
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Request a return"
        description="Choose what you're sending back and why."
        size="md"
      >
        <form onSubmit={submit} className="flex flex-col gap-6 p-6">
          <div>
            <span className="label-caps">Items</span>
            <ul className="mt-3 flex flex-col divide-y divide-hairline border-y border-hairline">
              {items.map((item) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm text-ink">{item.title}</p>
                      {item.variant_info && item.variant_info.length > 0 && (
                        <p className="text-caption normal-case tracking-normal text-muted">
                          {item.variant_info.map((v) => v.value).join(" / ")}
                        </p>
                      )}
                      <p className="text-caption normal-case tracking-normal text-muted">
                        {formatCurrency(Number(item.unit_price))} · {item.quantity}{" "}
                        ordered
                      </p>
                    </div>

                    <div>
                      <label htmlFor={`qty-${item.id}`} className="sr-only">
                        Quantity of {item.title} to return
                      </label>
                      <select
                        id={`qty-${item.id}`}
                        value={qty}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [item.id]: Number(e.target.value),
                          })
                        }
                        className="h-10 cursor-pointer rounded-sm border border-ink/15 bg-white px-3 text-body-sm outline-none focus:border-accent"
                      >
                        {Array.from({ length: item.quantity + 1 }, (_, n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {RETURN_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          <Textarea
            label="Anything else? (optional)"
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {refundEstimate > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_TACTILE }}
              className="flex items-baseline justify-between rounded-sm bg-cream px-5 py-4"
            >
              <span className="text-body-sm text-muted">Estimated refund</span>
              <span className="font-serif text-xl text-ink">
                {formatCurrency(refundEstimate)}
              </span>
            </motion.div>
          )}

          <p className="text-caption normal-case tracking-normal text-muted">
            Items must be unworn with tags attached. We&rsquo;ll email a prepaid
            label within one business day of approving the request.
          </p>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} disabled={selected.length === 0}>
              Submit request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
