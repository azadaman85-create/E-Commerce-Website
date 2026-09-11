"use client";

import { motion } from "framer-motion";
import { cn, formatDate } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { OrderTimelineEntry } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderTimeline({ entries }: { entries: OrderTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-body-sm text-muted">No status updates yet.</p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-8 pl-8">
      {/* The rail is drawn behind the markers and grows in on mount. */}
      <motion.span
        className="absolute left-[7px] top-2 w-px origin-top bg-hairline"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE_TACTILE }}
        style={{ bottom: "0.5rem" }}
        aria-hidden
      />

      {entries.map((entry, i) => {
        const isLatest = i === entries.length - 1;
        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: EASE_TACTILE, delay: i * 0.08 }}
            className="relative"
          >
            <span
              className={cn(
                "absolute -left-8 top-1.5 h-[15px] w-[15px] rounded-full border-2 bg-white",
                isLatest ? "border-accent" : "border-hairline",
              )}
              aria-hidden
            >
              {isLatest && (
                <motion.span
                  className="absolute inset-0.5 rounded-full bg-accent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                />
              )}
            </span>

            <p
              className={cn(
                "text-body-sm font-medium",
                isLatest ? "text-ink" : "text-muted",
              )}
            >
              {statusLabels[entry.status] ?? entry.status}
            </p>
            {entry.note && (
              <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                {entry.note}
              </p>
            )}
            <p className="mt-1 text-caption normal-case tracking-normal text-muted/70">
              {formatDate(entry.created_at, true)}
            </p>
          </motion.li>
        );
      })}
    </ol>
  );
}
