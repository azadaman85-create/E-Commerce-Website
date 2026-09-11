import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature } from "@/lib/razorpay";

const schema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Called by the Checkout.js success handler. The signature proves the
 * payment came from Razorpay and matches the order we created — without it,
 * anyone could POST here and mark an order paid.
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
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, signature } = parsed.data;

  if (!verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature })) {
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // The order must actually be the one this Razorpay order was created for.
  const { data: orderRow } = await admin
    .from("orders")
    .select("id, order_number, razorpay_order_id, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  const order = orderRow as {
    id: string;
    order_number: string;
    razorpay_order_id: string | null;
    payment_status: string;
  } | null;

  if (!order || order.razorpay_order_id !== razorpayOrderId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // The webhook may have already marked it paid — that is fine, not an error.
  if (order.payment_status !== "paid") {
    await admin
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
        fulfillment_status: "processing",
      })
      .eq("id", order.id);

    await admin.from("order_timeline").insert({
      order_id: order.id,
      status: "processing",
      note: `Payment captured (${razorpayPaymentId})`,
    });
  }

  return NextResponse.json({ ok: true, orderNumber: order.order_number });
}
