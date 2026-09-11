import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmation } from "@/lib/email/notify";

// Razorpay signs the raw body, so this route must not be pre-parsed or cached.
export const dynamic = "force-dynamic";

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        error_description?: string;
      };
    };
    refund?: {
      entity?: {
        payment_id?: string;
      };
    };
  };
}

/**
 * Razorpay's equivalent of Stripe's payment_intent.succeeded is
 * `payment.captured`. We also handle failures and refunds so the order's
 * payment_status stays truthful without an admin having to intervene.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const admin = createAdminClient();
  const payment = body.payload?.payment?.entity;

  async function findOrder(razorpayOrderId: string) {
    const { data } = await admin
      .from("orders")
      .select("id, payment_status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    return data as { id: string; payment_status: string } | null;
  }

  switch (body.event) {
    case "payment.captured": {
      if (!payment?.order_id) break;
      const order = await findOrder(payment.order_id);
      // Idempotent: a redelivered webhook must not double-write the timeline.
      if (!order || order.payment_status === "paid") break;

      await admin
        .from("orders")
        .update({
          payment_status: "paid",
          razorpay_payment_id: payment.id ?? null,
          fulfillment_status: "processing",
        })
        .eq("id", order.id);

      await admin.from("order_timeline").insert({
        order_id: order.id,
        status: "processing",
        note: `Payment captured via webhook (${payment.id ?? "unknown"})`,
      });

      // Only reached when this webhook was the first to mark the order paid;
      // the early return above covers the verify route having got there first.
      await sendOrderConfirmation(order.id);
      break;
    }

    case "payment.failed": {
      if (!payment?.order_id) break;
      const order = await findOrder(payment.order_id);
      if (!order || order.payment_status === "paid") break;

      await admin
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", order.id);

      await admin.from("order_timeline").insert({
        order_id: order.id,
        status: "pending",
        note: `Payment failed: ${payment.error_description ?? "no reason given"}`,
      });
      break;
    }

    case "refund.processed": {
      const paymentId = body.payload?.refund?.entity?.payment_id;
      if (!paymentId) break;

      const { data } = await admin
        .from("orders")
        .select("id")
        .eq("razorpay_payment_id", paymentId)
        .maybeSingle();

      const order = data as { id: string } | null;
      if (!order) break;

      await admin
        .from("orders")
        .update({ payment_status: "refunded" })
        .eq("id", order.id);

      await admin.from("order_timeline").insert({
        order_id: order.id,
        status: "cancelled",
        note: "Refund processed",
      });
      break;
    }

    default:
      // Unhandled events are acknowledged so Razorpay stops retrying.
      break;
  }

  return NextResponse.json({ received: true });
}
