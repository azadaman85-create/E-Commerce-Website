import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getRazorpay,
  isRazorpayConfigured,
  toMinorUnits,
} from "@/lib/razorpay";
import { computeTotals, eligibleSubtotalFor, validateCoupon } from "@/lib/pricing";
import {
  getDemoProductById,
  getDemoShippingMethod,
  isDemoMode,
  demoSettings,
} from "@/lib/demo";
import {
  findDemoCoupon,
  nextDemoOrderNumber,
  saveDemoOrder,
} from "@/lib/demo/orders";
import { effectivePrice, round2 } from "@/lib/utils";
import type { Coupon, ShippingMethod, SiteSettings } from "@/types";

const addressSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().max(32).optional().nullable(),
  address_line1: z.string().min(1).max(200),
  address_line2: z.string().max(200).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
});

const schema = z.object({
  email: z.string().email().max(254),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional().nullable(),
  shippingMethodId: z.string().uuid(),
  couponCode: z.string().max(64).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * Creates a pending order.
 *
 * Everything that affects money — unit prices, shipping, tax, the discount —
 * is recomputed here from the database. The client's numbers are never
 * trusted; it only tells us *what* is in the cart, not what it costs.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your details." },
      { status: 400 },
    );
  }

  const input = parsed.data;

  if (isDemoMode()) {
    return createDemoOrder(input);
  }

  const admin = createAdminClient();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---- Re-price every line from the database --------------------------------
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const { data: productRows } = await admin
    .from("products")
    .select(
      "id, title, slug, price, sale_price, sale_start, sale_end, stock_quantity, " +
        "track_inventory, allow_backorders, status, category_id, " +
        "product_images(image_url, sort_order)",
    )
    .in("id", productIds);

  type ProductRow = {
    id: string;
    title: string;
    slug: string;
    price: number;
    sale_price: number | null;
    sale_start: string | null;
    sale_end: string | null;
    stock_quantity: number;
    track_inventory: boolean;
    allow_backorders: boolean;
    status: string;
    category_id: string | null;
    product_images: { image_url: string; sort_order: number }[];
  };

  const products = new Map(
    ((productRows ?? []) as unknown as ProductRow[]).map((p) => [p.id, p]),
  );

  // Supabase is connected but the catalogue has not been seeded yet. In
  // development, complete the order against the demo catalogue so the cart ->
  // checkout -> confirmation flow stays testable during setup.
  if (products.size === 0 && process.env.NODE_ENV !== "production") {
    return createDemoOrder(input);
  }

  const variantIds = input.items
    .map((i) => i.variantId)
    .filter((id): id is string => Boolean(id));

  const variants = new Map<
    string,
    { id: string; product_id: string; sku: string | null; price: number | null; stock_quantity: number; option_values: { option_name: string; value: string }[] }
  >();

  if (variantIds.length > 0) {
    const { data: variantRows } = await admin
      .from("product_variants")
      .select("id, product_id, sku, price, stock_quantity, option_values")
      .in("id", variantIds);
    for (const v of (variantRows ?? []) as never[]) {
      const variant = v as unknown as {
        id: string;
        product_id: string;
        sku: string | null;
        price: number | null;
        stock_quantity: number;
        option_values: { option_name: string; value: string }[];
      };
      variants.set(variant.id, variant);
    }
  }

  const now = Date.now();
  const lines: {
    productId: string;
    variantId: string | null;
    title: string;
    slug: string;
    imageUrl: string | null;
    variantInfo: { option_name: string; value: string }[] | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    categoryId: string | null;
  }[] = [];

  for (const item of input.items) {
    const product = products.get(item.productId);
    if (!product || product.status !== "active") {
      return NextResponse.json(
        { error: "One of the items in your cart is no longer available." },
        { status: 409 },
      );
    }

    const variant = item.variantId ? variants.get(item.variantId) : null;
    if (item.variantId && (!variant || variant.product_id !== product.id)) {
      return NextResponse.json(
        { error: "A selected product option is no longer available." },
        { status: 409 },
      );
    }

    // Stock check against the authoritative row, not the client's cached max.
    const availableStock = variant
      ? variant.stock_quantity
      : product.track_inventory
        ? product.stock_quantity
        : Number.POSITIVE_INFINITY;

    if (!product.allow_backorders && item.quantity > availableStock) {
      return NextResponse.json(
        {
          error: `"${product.title}" only has ${Math.max(0, availableStock)} left in stock.`,
        },
        { status: 409 },
      );
    }

    const saleLive =
      product.sale_price !== null &&
      Number(product.sale_price) < Number(product.price) &&
      (!product.sale_start || new Date(product.sale_start).getTime() <= now) &&
      (!product.sale_end || new Date(product.sale_end).getTime() >= now);

    const basePrice = saleLive ? Number(product.sale_price) : Number(product.price);
    const unitPrice =
      variant?.price !== null && variant?.price !== undefined
        ? Number(variant.price)
        : basePrice;

    const image = [...(product.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    )[0];

    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      title: product.title,
      slug: product.slug,
      imageUrl: image?.image_url ?? null,
      variantInfo: variant?.option_values ?? null,
      quantity: item.quantity,
      unitPrice: round2(unitPrice),
      lineTotal: round2(unitPrice * item.quantity),
      categoryId: product.category_id,
    });
  }

  // ---- Shipping, coupon, settings ------------------------------------------
  const [{ data: methodRow }, { data: settingsRow }] = await Promise.all([
    admin.from("shipping_methods").select("*").eq("id", input.shippingMethodId).maybeSingle(),
    admin.from("site_settings").select("*").limit(1).maybeSingle(),
  ]);

  const shippingMethod = methodRow as ShippingMethod | null;
  if (!shippingMethod || !shippingMethod.is_active) {
    return NextResponse.json(
      { error: "That shipping method is unavailable." },
      { status: 400 },
    );
  }

  const settings = settingsRow as SiteSettings | null;
  const taxRate = Number(settings?.tax_rate ?? 0);
  const taxInclusive = Boolean(settings?.tax_inclusive);
  const currency = settings?.currency_code ?? "INR";

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0));

  let appliedCoupon = null;
  if (input.couponCode?.trim()) {
    const { data: couponRow } = await admin
      .from("coupons")
      .select("*")
      .ilike("code", input.couponCode.trim())
      .maybeSingle();

    const coupon = couponRow as Coupon | null;

    let customerUsage = 0;
    if (user && coupon?.per_customer_limit) {
      const { count } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .ilike("coupon_code", coupon.code);
      customerUsage = count ?? 0;
    }

    const validation = validateCoupon({
      coupon,
      subtotal,
      eligibleSubtotal: coupon ? eligibleSubtotalFor(coupon, lines) : 0,
      customerUsage,
    });

    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
    appliedCoupon = validation.applied ?? null;
  }

  const totals = computeTotals({
    items: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    coupon: appliedCoupon,
    shippingMethod,
    taxRate,
    taxInclusive,
  });

  // ---- Create the Razorpay order first -------------------------------------
  // If this fails we have not yet written anything, so there is no orphaned
  // pending order to clean up.
  let razorpayOrderId: string | null = null;

  if (isRazorpayConfigured()) {
    try {
      const rzp = getRazorpay();
      const rzpOrder = await rzp.orders.create({
        amount: toMinorUnits(totals.total),
        currency,
        receipt: `rcpt_${Date.now()}`,
        notes: { email: input.email },
      });
      razorpayOrderId = rzpOrder.id;
    } catch (error) {
      console.error("Razorpay order creation failed", error);
      return NextResponse.json(
        { error: "Could not start the payment. Please try again." },
        { status: 502 },
      );
    }
  }

  // ---- Persist the order ---------------------------------------------------
  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email: input.email.toLowerCase().trim(),
      shipping_address: input.shippingAddress,
      billing_address: input.billingAddress ?? input.shippingAddress,
      shipping_method: shippingMethod.name,
      shipping_cost: totals.shipping,
      subtotal: totals.subtotal,
      discount_amount: totals.discount,
      tax_amount: totals.tax,
      total: totals.total,
      coupon_code: appliedCoupon?.code ?? null,
      payment_status: "pending",
      fulfillment_status: "pending",
      razorpay_order_id: razorpayOrderId,
    })
    .select("id, order_number, total")
    .single();

  if (orderError || !orderRow) {
    console.error("Order insert failed", orderError);
    return NextResponse.json(
      { error: "Could not create your order. Please try again." },
      { status: 500 },
    );
  }

  const order = orderRow as { id: string; order_number: string; total: number };

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      variant_id: line.variantId,
      title: line.title,
      slug: line.slug,
      image_url: line.imageUrl,
      variant_info: line.variantInfo,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
    })),
  );

  if (itemsError) {
    console.error("Order items insert failed", itemsError);
    // Roll back the order header so we do not leave an empty order behind.
    await admin.from("orders").delete().eq("id", order.id);
    return NextResponse.json(
      { error: "Could not create your order. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    amount: toMinorUnits(totals.total),
    currency,
    razorpayOrderId,
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
    totals,
    // When Razorpay is not configured the storefront falls back to a
    // manual-confirmation flow so the build stays demoable.
    paymentConfigured: isRazorpayConfigured(),
  });
}

/**
 * Prices and records an order against the in-memory demo catalogue.
 *
 * Used when Supabase is not configured at all, and in development when it is
 * configured but not yet seeded — so the checkout flow is testable either way.
 * Never reached in production with a populated catalogue.
 */
function createDemoOrder(input: z.infer<typeof schema>) {
    const shippingMethod = getDemoShippingMethod(input.shippingMethodId);
    if (!shippingMethod) {
      return NextResponse.json(
        { error: "That shipping method is unavailable." },
        { status: 400 },
      );
    }

    const demoLines = [];
    for (const item of input.items) {
      const product = getDemoProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: "One of the items in your cart is no longer available." },
          { status: 409 },
        );
      }

      const variant = item.variantId
        ? (product.product_variants ?? []).find((v) => v.id === item.variantId)
        : null;

      const unitPrice =
        variant?.price != null ? Number(variant.price) : effectivePrice(product);

      demoLines.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        title: product.title,
        slug: product.slug,
        imageUrl: product.product_images?.[0]?.image_url ?? null,
        variantInfo: variant?.option_values ?? null,
        quantity: item.quantity,
        unitPrice: round2(unitPrice),
        lineTotal: round2(unitPrice * item.quantity),
        categoryId: product.category_id,
      });
    }

    const demoSubtotal = round2(
      demoLines.reduce((sum, l) => sum + l.lineTotal, 0),
    );

    let demoCoupon = null;
    if (input.couponCode?.trim()) {
      const coupon = findDemoCoupon(input.couponCode);
      const validation = validateCoupon({
        coupon,
        subtotal: demoSubtotal,
        eligibleSubtotal: coupon ? eligibleSubtotalFor(coupon, demoLines) : 0,
      });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.message }, { status: 400 });
      }
      demoCoupon = validation.applied ?? null;
    }

    const demoTotals = computeTotals({
      items: demoLines.map((l) => ({
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
      coupon: demoCoupon,
      shippingMethod,
      taxRate: Number(demoSettings.tax_rate),
      taxInclusive: demoSettings.tax_inclusive,
    });

    const orderNumber = nextDemoOrderNumber();
    const now = new Date().toISOString();

    saveDemoOrder({
      id: orderNumber,
      order_number: orderNumber,
      user_id: null,
      email: input.email.toLowerCase().trim(),
      shipping_address: input.shippingAddress,
      billing_address: input.billingAddress ?? input.shippingAddress,
      shipping_method: shippingMethod.name,
      shipping_cost: demoTotals.shipping,
      subtotal: demoTotals.subtotal,
      discount_amount: demoTotals.discount,
      tax_amount: demoTotals.tax,
      total: demoTotals.total,
      coupon_code: demoCoupon?.code ?? null,
      payment_status: "pending",
      fulfillment_status: "pending",
      razorpay_order_id: null,
      razorpay_payment_id: null,
      tracking_number: null,
      tracking_carrier: null,
      notes: null,
      created_at: now,
      updated_at: now,
      order_items: demoLines.map((line, i) => ({
        id: `${orderNumber}-item-${i}`,
        order_id: orderNumber,
        product_id: line.productId,
        variant_id: line.variantId,
        title: line.title,
        slug: line.slug,
        image_url: line.imageUrl,
        variant_info: line.variantInfo,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        line_total: line.lineTotal,
      })),
    });

    return NextResponse.json({
      orderId: orderNumber,
      orderNumber,
      amount: Math.round(demoTotals.total * 100),
      currency: demoSettings.currency_code,
      razorpayOrderId: null,
      razorpayKeyId: null,
      totals: demoTotals,
      paymentConfigured: false,
      demo: true,
    });
}
