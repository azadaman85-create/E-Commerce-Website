import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { eligibleSubtotalFor, validateCoupon } from "@/lib/pricing";
import { isDemoMode, getDemoProductById } from "@/lib/demo";
import { findDemoCoupon } from "@/lib/demo/orders";
import { round2 } from "@/lib/utils";
import { effectivePrice } from "@/lib/utils";
import type { Coupon } from "@/types";

const schema = z.object({
  code: z.string().min(1).max(64),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Demo mode: validate against the in-memory coupon list and demo prices.
  if (isDemoMode()) {
    const coupon = findDemoCoupon(parsed.data.code);

    const lines = parsed.data.items.map((item) => {
      const product = getDemoProductById(item.productId);
      const unit = product ? effectivePrice(product) : item.unitPrice;
      return {
        productId: item.productId,
        categoryId: product?.category_id ?? null,
        lineTotal: round2(unit * item.quantity),
      };
    });

    const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));
    const result = validateCoupon({
      coupon,
      subtotal,
      eligibleSubtotal: coupon ? eligibleSubtotalFor(coupon, lines) : 0,
    });

    return result.ok
      ? NextResponse.json({ applied: result.applied })
      : NextResponse.json({ error: result.message }, { status: 400 });
  }

  // Coupons are not publicly readable, so this lookup uses the service role.
  const admin = createAdminClient();
  const { data: couponRow } = await admin
    .from("coupons")
    .select("*")
    .ilike("code", parsed.data.code.trim())
    .maybeSingle();

  const coupon = couponRow as Coupon | null;

  // Re-price from the database rather than trusting the client's unitPrice.
  const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
  const { data: products } = await admin
    .from("products")
    .select("id, category_id, price, sale_price, sale_start, sale_end")
    .in("id", productIds);

  const priceById = new Map(
    ((products ?? []) as {
      id: string;
      category_id: string | null;
      price: number;
      sale_price: number | null;
      sale_start: string | null;
      sale_end: string | null;
    }[]).map((p) => {
      const now = Date.now();
      const saleLive =
        p.sale_price !== null &&
        p.sale_price < p.price &&
        (!p.sale_start || new Date(p.sale_start).getTime() <= now) &&
        (!p.sale_end || new Date(p.sale_end).getTime() >= now);
      return [
        p.id,
        { price: saleLive ? Number(p.sale_price) : Number(p.price), categoryId: p.category_id },
      ];
    }),
  );

  const lines = parsed.data.items.map((item) => {
    const entry = priceById.get(item.productId);
    const unit = entry?.price ?? item.unitPrice;
    return {
      productId: item.productId,
      categoryId: entry?.categoryId ?? null,
      lineTotal: round2(unit * item.quantity),
    };
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

  // Per-customer usage, when the coupon caps it and we know who is asking.
  let customerUsage = 0;
  if (coupon?.per_customer_limit) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { count } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .ilike("coupon_code", coupon.code);
      customerUsage = count ?? 0;
    }
  }

  const result = validateCoupon({
    coupon,
    subtotal,
    eligibleSubtotal: coupon ? eligibleSubtotalFor(coupon, lines) : 0,
    customerUsage,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ applied: result.applied });
}
