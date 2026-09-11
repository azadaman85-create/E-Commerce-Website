import crypto from "node:crypto";
import Razorpay from "razorpay";

/**
 * Server-side Razorpay client.
 *
 * Note: Razorpay does not have Stripe's PaymentIntent/Elements model. The
 * equivalent flow is: create an Order server-side, hand its id to
 * Checkout.js in the browser, then verify the returned signature (and the
 * `payment.captured` webhook) on the server before marking an order paid.
 */
export function getRazorpay() {
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay is not configured — set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  return new Razorpay({ key_id, key_secret });
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
}

/** Razorpay works in the smallest currency unit (paise for INR). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

/**
 * Verifies the handler signature returned by Checkout.js.
 * HMAC-SHA256 of `${order_id}|${payment_id}` keyed with the API secret.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  return timingSafeEqual(expected, params.signature);
}

/** Verifies the X-Razorpay-Signature header on a webhook delivery. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // crypto.timingSafeEqual throws on length mismatch, so guard first.
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
