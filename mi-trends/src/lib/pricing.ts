import { round2 } from "@/lib/utils";
import type { AppliedCoupon, CartItem, Coupon, ShippingMethod } from "@/types";

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

interface ComputeInput {
  items: Pick<CartItem, "unitPrice" | "quantity">[];
  coupon?: AppliedCoupon | null;
  shippingMethod?: ShippingMethod | null;
  taxRate: number;
  taxInclusive: boolean;
}

/**
 * Single source of truth for order arithmetic. The checkout UI and the
 * server-side order creation both call this, so a tampered client cannot
 * produce a total the server disagrees with.
 */
export function computeTotals({
  items,
  coupon,
  shippingMethod,
  taxRate,
  taxInclusive,
}: ComputeInput): OrderTotals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );

  const discount = round2(Math.min(coupon?.discount ?? 0, subtotal));
  const discountedSubtotal = round2(subtotal - discount);

  let shipping = 0;
  if (shippingMethod) {
    const threshold = shippingMethod.free_shipping_threshold;
    const qualifiesForFree = threshold !== null && discountedSubtotal >= threshold;
    shipping = qualifiesForFree ? 0 : Number(shippingMethod.price);
  }
  shipping = round2(shipping);

  const taxable = round2(discountedSubtotal + shipping);
  const rate = taxRate / 100;

  // Tax-inclusive pricing: the tax is already inside the line prices, so we
  // back it out for display rather than adding it on top.
  const tax = taxInclusive
    ? round2(taxable - taxable / (1 + rate))
    : round2(taxable * rate);

  const total = taxInclusive ? taxable : round2(taxable + tax);

  return { subtotal, discount, shipping, tax, total };
}

export type CouponFailure =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "usage_limit"
  | "min_order"
  | "not_applicable";

export interface CouponValidation {
  ok: boolean;
  reason?: CouponFailure;
  message?: string;
  applied?: AppliedCoupon;
}

const failureMessages: Record<CouponFailure, string> = {
  not_found: "That code is not recognised.",
  inactive: "That code is no longer active.",
  not_started: "That code is not valid yet.",
  expired: "That code has expired.",
  usage_limit: "That code has reached its usage limit.",
  min_order: "Your order does not meet this code's minimum.",
  not_applicable: "That code does not apply to anything in your cart.",
};

interface ValidateInput {
  coupon: Coupon | null;
  subtotal: number;
  /** Eligible subtotal — only lines the coupon actually applies to. */
  eligibleSubtotal?: number;
  customerUsage?: number;
}

export function validateCoupon({
  coupon,
  subtotal,
  eligibleSubtotal,
  customerUsage = 0,
}: ValidateInput): CouponValidation {
  const fail = (reason: CouponFailure): CouponValidation => ({
    ok: false,
    reason,
    message: failureMessages[reason],
  });

  if (!coupon) return fail("not_found");
  if (!coupon.is_active) return fail("inactive");

  const now = Date.now();
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    return fail("not_started");
  }
  if (coupon.valid_to && new Date(coupon.valid_to).getTime() < now) {
    return fail("expired");
  }
  if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
    return fail("usage_limit");
  }
  if (coupon.per_customer_limit !== null && customerUsage >= coupon.per_customer_limit) {
    return fail("usage_limit");
  }
  if (subtotal < Number(coupon.min_order_amount)) {
    return fail("min_order");
  }

  const base = eligibleSubtotal ?? subtotal;
  if (base <= 0) return fail("not_applicable");

  const discount =
    coupon.type === "percentage"
      ? round2((base * Number(coupon.value)) / 100)
      : round2(Math.min(Number(coupon.value), base));

  if (discount <= 0) return fail("not_applicable");

  return {
    ok: true,
    applied: {
      code: coupon.code.toUpperCase(),
      type: coupon.type,
      value: Number(coupon.value),
      discount,
    },
  };
}

/**
 * When a coupon is scoped to specific products or categories, only those
 * lines count toward the discount base.
 */
export function eligibleSubtotalFor(
  coupon: Coupon,
  lines: { productId: string; categoryId: string | null; lineTotal: number }[],
): number {
  const productScope = coupon.applicable_products ?? [];
  const categoryScope = coupon.applicable_categories ?? [];

  if (productScope.length === 0 && categoryScope.length === 0) {
    return round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
  }

  return round2(
    lines
      .filter(
        (line) =>
          productScope.includes(line.productId) ||
          (line.categoryId !== null && categoryScope.includes(line.categoryId)),
      )
      .reduce((sum, l) => sum + l.lineTotal, 0),
  );
}
