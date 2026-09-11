import { describe, expect, it } from "vitest";
import {
  computeTotals,
  eligibleSubtotalFor,
  validateCoupon,
} from "@/lib/pricing";
import type { Coupon, ShippingMethod } from "@/types";

const shipping = (over: Partial<ShippingMethod> = {}): ShippingMethod => ({
  id: "ship-1",
  name: "Standard",
  price: 99,
  estimated_delivery: "4–6 days",
  free_shipping_threshold: 2000,
  sort_order: 0,
  is_active: true,
  ...over,
});

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: "c1",
  code: "SAVE10",
  type: "percentage",
  value: 10,
  min_order_amount: 0,
  usage_limit: null,
  per_customer_limit: null,
  times_used: 0,
  valid_from: null,
  valid_to: null,
  applicable_products: [],
  applicable_categories: [],
  is_active: true,
  created_at: new Date().toISOString(),
  ...over,
});

const line = (unitPrice: number, quantity = 1) => ({ unitPrice, quantity });

describe("computeTotals", () => {
  it("sums line totals into the subtotal", () => {
    const t = computeTotals({
      items: [line(1000, 2), line(500, 3)],
      taxRate: 0,
      taxInclusive: false,
    });
    expect(t.subtotal).toBe(3500);
  });

  it("adds tax on top when pricing is tax-exclusive", () => {
    const t = computeTotals({
      items: [line(1000)],
      taxRate: 18,
      taxInclusive: false,
    });
    expect(t.tax).toBe(180);
    expect(t.total).toBe(1180);
  });

  it("backs tax out of the total when pricing is tax-inclusive", () => {
    const t = computeTotals({
      items: [line(1180)],
      taxRate: 18,
      taxInclusive: true,
    });
    // The customer still pays 1180; the tax is carved out for display.
    expect(t.total).toBe(1180);
    expect(t.tax).toBe(180);
  });

  it("charges shipping below the free threshold", () => {
    const t = computeTotals({
      items: [line(1500)],
      shippingMethod: shipping(),
      taxRate: 0,
      taxInclusive: false,
    });
    expect(t.shipping).toBe(99);
  });

  it("waives shipping at or above the threshold", () => {
    const t = computeTotals({
      items: [line(2000)],
      shippingMethod: shipping(),
      taxRate: 0,
      taxInclusive: false,
    });
    expect(t.shipping).toBe(0);
  });

  it("tests the threshold against the discounted subtotal, not the gross", () => {
    // 2500 gross qualifies, but a 600 discount drops it under 2000 — the
    // customer should not get free shipping on money they did not spend.
    const t = computeTotals({
      items: [line(2500)],
      coupon: { code: "X", type: "fixed", value: 600, discount: 600 },
      shippingMethod: shipping(),
      taxRate: 0,
      taxInclusive: false,
    });
    expect(t.shipping).toBe(99);
  });

  it("never lets a discount exceed the subtotal", () => {
    const t = computeTotals({
      items: [line(500)],
      coupon: { code: "BIG", type: "fixed", value: 9999, discount: 9999 },
      taxRate: 0,
      taxInclusive: false,
    });
    expect(t.discount).toBe(500);
    expect(t.total).toBe(0);
    expect(t.total).toBeGreaterThanOrEqual(0);
  });

  it("taxes shipping along with the goods", () => {
    const t = computeTotals({
      items: [line(1000)],
      shippingMethod: shipping({ free_shipping_threshold: null, price: 100 }),
      taxRate: 10,
      taxInclusive: false,
    });
    expect(t.tax).toBe(110);
    expect(t.total).toBe(1210);
  });

  it("keeps money to two decimals rather than drifting", () => {
    const t = computeTotals({
      items: [line(0.1), line(0.2)],
      taxRate: 0,
      taxInclusive: false,
    });
    // 0.1 + 0.2 is 0.30000000000000004 in float arithmetic.
    expect(t.subtotal).toBe(0.3);
  });

  it("returns zeroes for an empty cart", () => {
    const t = computeTotals({ items: [], taxRate: 18, taxInclusive: false });
    expect(t).toMatchObject({ subtotal: 0, discount: 0, shipping: 0, total: 0 });
  });
});

describe("validateCoupon", () => {
  const subtotal = 5000;

  it("accepts a valid percentage coupon", () => {
    const r = validateCoupon({ coupon: coupon(), subtotal });
    expect(r.ok).toBe(true);
    expect(r.applied?.discount).toBe(500);
  });

  it("accepts a valid fixed coupon", () => {
    const r = validateCoupon({
      coupon: coupon({ type: "fixed", value: 750 }),
      subtotal,
    });
    expect(r.applied?.discount).toBe(750);
  });

  it("caps a fixed discount at the eligible subtotal", () => {
    const r = validateCoupon({
      coupon: coupon({ type: "fixed", value: 9999 }),
      subtotal: 400,
    });
    expect(r.applied?.discount).toBe(400);
  });

  it("rejects an unknown code", () => {
    expect(validateCoupon({ coupon: null, subtotal })).toMatchObject({
      ok: false,
      reason: "not_found",
    });
  });

  it("rejects an inactive coupon", () => {
    expect(
      validateCoupon({ coupon: coupon({ is_active: false }), subtotal }),
    ).toMatchObject({ ok: false, reason: "inactive" });
  });

  it("rejects a coupon whose window has not opened", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      validateCoupon({ coupon: coupon({ valid_from: tomorrow }), subtotal }),
    ).toMatchObject({ ok: false, reason: "not_started" });
  });

  it("rejects an expired coupon", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    expect(
      validateCoupon({ coupon: coupon({ valid_to: yesterday }), subtotal }),
    ).toMatchObject({ ok: false, reason: "expired" });
  });

  it("rejects once the global usage limit is reached", () => {
    expect(
      validateCoupon({
        coupon: coupon({ usage_limit: 10, times_used: 10 }),
        subtotal,
      }),
    ).toMatchObject({ ok: false, reason: "usage_limit" });
  });

  it("rejects once this customer has used their allowance", () => {
    expect(
      validateCoupon({
        coupon: coupon({ per_customer_limit: 1 }),
        subtotal,
        customerUsage: 1,
      }),
    ).toMatchObject({ ok: false, reason: "usage_limit" });
  });

  it("rejects below the minimum order amount", () => {
    expect(
      validateCoupon({ coupon: coupon({ min_order_amount: 6000 }), subtotal }),
    ).toMatchObject({ ok: false, reason: "min_order" });
  });

  it("allows an order exactly at the minimum", () => {
    expect(
      validateCoupon({ coupon: coupon({ min_order_amount: 5000 }), subtotal }),
    ).toMatchObject({ ok: true });
  });

  it("rejects when nothing in the cart is eligible", () => {
    expect(
      validateCoupon({ coupon: coupon(), subtotal, eligibleSubtotal: 0 }),
    ).toMatchObject({ ok: false, reason: "not_applicable" });
  });

  it("discounts only the eligible portion of a scoped coupon", () => {
    const r = validateCoupon({
      coupon: coupon({ value: 50 }),
      subtotal: 5000,
      eligibleSubtotal: 1000,
    });
    // 50% of the eligible 1000, not of the whole 5000.
    expect(r.applied?.discount).toBe(500);
  });

  it("uppercases the code it hands back", () => {
    const r = validateCoupon({ coupon: coupon({ code: "save10" }), subtotal });
    expect(r.applied?.code).toBe("SAVE10");
  });
});

describe("eligibleSubtotalFor", () => {
  const lines = [
    { productId: "p1", categoryId: "c1", lineTotal: 1000 },
    { productId: "p2", categoryId: "c2", lineTotal: 2000 },
  ];

  it("covers the whole cart when the coupon is unscoped", () => {
    expect(eligibleSubtotalFor(coupon(), lines)).toBe(3000);
  });

  it("counts only the named products", () => {
    expect(
      eligibleSubtotalFor(coupon({ applicable_products: ["p1"] }), lines),
    ).toBe(1000);
  });

  it("counts only the named categories", () => {
    expect(
      eligibleSubtotalFor(coupon({ applicable_categories: ["c2"] }), lines),
    ).toBe(2000);
  });

  it("treats product and category scopes as a union, not an intersection", () => {
    expect(
      eligibleSubtotalFor(
        coupon({ applicable_products: ["p1"], applicable_categories: ["c2"] }),
        lines,
      ),
    ).toBe(3000);
  });

  it("returns zero when the scope matches nothing", () => {
    expect(
      eligibleSubtotalFor(coupon({ applicable_products: ["nope"] }), lines),
    ).toBe(0);
  });
});
