import type { OrderWithItems, ReturnStatus } from "@/types";

/** Matches the window promised on the returns policy page. */
export const RETURN_WINDOW_DAYS = 30;

export const RETURN_REASONS = [
  "Doesn't fit",
  "Not as described",
  "Arrived damaged",
  "Wrong item sent",
  "Changed my mind",
  "Quality not as expected",
] as const;

export type ReturnEligibility =
  | { eligible: true; daysLeft: number }
  | { eligible: false; reason: string };

/**
 * Whether an order can still be returned.
 *
 * The clock runs from delivery where we know it, and from the order date
 * otherwise — starting it at dispatch would quietly eat part of the window
 * the policy promises while the parcel is still in transit.
 */
export function checkReturnEligibility(
  order: Pick<
    OrderWithItems,
    "payment_status" | "fulfillment_status" | "created_at" | "updated_at"
  >,
  hasOpenReturn = false,
): ReturnEligibility {
  if (order.payment_status !== "paid") {
    return { eligible: false, reason: "This order has not been paid for." };
  }

  if (order.fulfillment_status === "cancelled") {
    return { eligible: false, reason: "This order was cancelled." };
  }

  if (hasOpenReturn) {
    return {
      eligible: false,
      reason: "A return is already open for this order.",
    };
  }

  const start =
    order.fulfillment_status === "delivered"
      ? new Date(order.updated_at)
      : new Date(order.created_at);

  const elapsedDays = Math.floor(
    (Date.now() - start.getTime()) / 86_400_000,
  );
  const daysLeft = RETURN_WINDOW_DAYS - elapsedDays;

  if (daysLeft <= 0) {
    return {
      eligible: false,
      reason: `The ${RETURN_WINDOW_DAYS}-day return window has closed.`,
    };
  }

  return { eligible: true, daysLeft };
}

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  refunded: "Refunded",
};

export const RETURN_STATUS_TONE: Record<
  ReturnStatus,
  "warning" | "accent" | "danger" | "info" | "success"
> = {
  requested: "warning",
  approved: "accent",
  rejected: "danger",
  received: "info",
  refunded: "success",
};
