import type { Coupon, OrderWithItems } from "@/types";

/**
 * In-memory order store for demo mode.
 *
 * Demo mode has no database, so orders placed during a session live here.
 * Single-process only and cleared on restart — which is exactly what you
 * want for a throwaway demo, and never used once Supabase is configured.
 */
const orders = new Map<string, OrderWithItems>();

let sequence = 10_000;

export function nextDemoOrderNumber(): string {
  sequence += 1;
  return `ORD-${sequence}`;
}

export function saveDemoOrder(order: OrderWithItems): void {
  orders.set(order.order_number, order);

  // Keep the map from growing without bound over a long dev session.
  if (orders.size > 50) {
    const oldest = orders.keys().next().value;
    if (oldest) orders.delete(oldest);
  }
}

export function getDemoOrder(orderNumber: string): OrderWithItems | null {
  return orders.get(orderNumber) ?? null;
}

/** Demo coupons, matching the codes in the SQL seed. */
export const DEMO_COUPONS: Coupon[] = [
  {
    id: "demo-coupon-welcome10",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    min_order_amount: 2000,
    usage_limit: 500,
    per_customer_limit: 1,
    times_used: 0,
    valid_from: null,
    valid_to: null,
    applicable_products: [],
    applicable_categories: [],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-coupon-flat500",
    code: "FLAT500",
    type: "fixed",
    value: 500,
    min_order_amount: 5000,
    usage_limit: 200,
    per_customer_limit: 2,
    times_used: 0,
    valid_from: null,
    valid_to: null,
    applicable_products: [],
    applicable_categories: [],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export function findDemoCoupon(code: string): Coupon | null {
  const needle = code.trim().toUpperCase();
  return DEMO_COUPONS.find((c) => c.code === needle) ?? null;
}
