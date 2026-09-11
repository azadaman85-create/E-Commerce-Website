"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Package, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { FulfillmentBadge, PaymentBadge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/admin/AdminUI";
import { OrderTimeline } from "@/components/storefront/OrderTimeline";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type {
  FulfillmentStatus,
  OrderTimelineEntry,
  OrderWithItems,
  PaymentStatus,
  Profile,
} from "@/types";

const FULFILLMENT: FulfillmentStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export function OrderDetail({
  order: initial,
  customer,
  siteName,
  currencySymbol,
  currencyCode,
}: {
  order: OrderWithItems;
  customer: Profile | null;
  siteName: string;
  currencySymbol: string;
  currencyCode: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();

  const [order, setOrder] = useState(initial);
  const [timeline, setTimeline] = useState<OrderTimelineEntry[]>(
    [...(initial.order_timeline ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  );

  const [fulfillment, setFulfillment] = useState(order.fulfillment_status);
  const [payment, setPayment] = useState(order.payment_status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [carrier, setCarrier] = useState(order.tracking_carrier ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [printMode, setPrintMode] = useState<"invoice" | "packing-slip">("invoice");

  /**
   * Switches the document into the requested print layout, waits for React to
   * paint it, then opens the print dialog. A packing slip deliberately omits
   * prices — it goes in the box, where the customer's card total has no place.
   */
  function printDocument(mode: "invoice" | "packing-slip") {
    setPrintMode(mode);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  const money = (n: number) => formatCurrency(Number(n), currencySymbol, currencyCode);
  const packingSlip = printMode === "packing-slip";

  async function saveChanges() {
    setSaving(true);
    try {
      const statusChanged = fulfillment !== order.fulfillment_status;
      const justShipped =
        fulfillment === "shipped" && order.fulfillment_status !== "shipped";

      const { error } = await supabase
        .from("orders")
        .update({
          fulfillment_status: fulfillment,
          payment_status: payment,
          tracking_number: trackingNumber.trim() || null,
          tracking_carrier: carrier.trim() || null,
        })
        .eq("id", order.id);

      if (error) {
        toast.error("Couldn't update the order", error.message);
        return;
      }

      // Log to the timeline whenever the status moves or a note is added.
      if (statusChanged || note.trim()) {
        const { data: entry } = await supabase
          .from("order_timeline")
          .insert({
            order_id: order.id,
            status: fulfillment,
            note: note.trim() || null,
          })
          .select()
          .single();

        if (entry) setTimeline((prev) => [...prev, entry as OrderTimelineEntry]);
      }

      setOrder({
        ...order,
        fulfillment_status: fulfillment,
        payment_status: payment,
        tracking_number: trackingNumber.trim() || null,
        tracking_carrier: carrier.trim() || null,
      });
      setNote("");

      // Supabase cannot send mail, so the notification goes through an
      // admin-only route once the write has actually landed.
      if (justShipped) {
        const res = await fetch("/api/orders/notify-shipped", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        if (res.ok) {
          toast.success("Order updated", "Shipping notification sent.");
        } else {
          // The status change succeeded; only the email did not.
          toast.info("Order updated", "Couldn't send the shipping email.");
        }
      } else {
        toast.success("Order updated");
      }

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const card = "card-surface p-6";

  return (
    <>
      <Link
        href="/admin/orders"
        className="no-print mb-6 inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        All orders
      </Link>

      <PageHeader
        title={order.order_number}
        description={`Placed ${formatDate(order.created_at, true)}`}
        action={
          <div className="no-print flex gap-3">
            <Button variant="secondary" onClick={() => printDocument("invoice")}>
              <Printer className="h-4 w-4" aria-hidden />
              Print invoice
            </Button>
            <Button variant="secondary" onClick={() => printDocument("packing-slip")}>
              <Package className="h-4 w-4" aria-hidden />
              Packing slip
            </Button>
            <Button onClick={saveChanges} loading={saving}>
              <Save className="h-4 w-4" aria-hidden />
              Save changes
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FulfillmentBadge status={order.fulfillment_status} />
        <PaymentBadge status={order.payment_status} />
        {order.coupon_code && (
          <span className="rounded-full bg-cream px-3 py-1 text-caption normal-case tracking-normal text-muted">
            Coupon {order.coupon_code}
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-hairline">
                    {["Product", "Variant", "Qty", "Unit", "Total"].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className={cn(
                          "pb-3 text-caption uppercase tracking-[0.1em] text-muted",
                          // Prices are omitted from a packing slip.
                          packingSlip &&
                            (header === "Unit" || header === "Total") &&
                            "print:hidden",
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-sm bg-cream">
                            {item.image_url && (
                              <Image
                                src={item.image_url}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="text-body-sm text-ink">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-body-sm text-muted">
                        {item.variant_info?.length
                          ? item.variant_info.map((v) => v.value).join(" / ")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-body-sm tabular-nums text-ink">
                        {item.quantity}
                      </td>
                      <td
                        className={cn(
                          "py-3 pr-4 text-body-sm tabular-nums text-muted",
                          packingSlip && "print:hidden",
                        )}
                      >
                        {money(item.unit_price)}
                      </td>
                      <td
                        className={cn(
                          "py-3 text-body-sm tabular-nums text-ink",
                          packingSlip && "print:hidden",
                        )}
                      >
                        {money(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl
              className={cn(
                "mt-8 flex flex-col gap-3 border-t border-hairline pt-6 text-body-sm",
                packingSlip && "print:hidden",
              )}
            >
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink tabular-nums">{money(order.subtotal)}</dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-success tabular-nums">
                    −{money(order.discount_amount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">
                  Shipping{order.shipping_method ? ` · ${order.shipping_method}` : ""}
                </dt>
                <dd className="text-ink tabular-nums">{money(order.shipping_cost)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="text-ink tabular-nums">{money(order.tax_amount)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-hairline pt-4">
                <dt className="text-label uppercase tracking-[0.1em] text-ink">Total</dt>
                <dd className="font-serif text-xl text-ink tabular-nums">
                  {money(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className={card}>
              <h2 className="mb-5 text-label uppercase tracking-[0.1em] text-ink">
                Shipping address
              </h2>
              <address className="not-italic text-body-sm leading-relaxed text-muted">
                {order.shipping_address.full_name}
                <br />
                {order.shipping_address.address_line1}
                {order.shipping_address.address_line2 && (
                  <>
                    <br />
                    {order.shipping_address.address_line2}
                  </>
                )}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state}{" "}
                {order.shipping_address.zip}
                <br />
                {order.shipping_address.country}
                {order.shipping_address.phone && (
                  <>
                    <br />
                    {order.shipping_address.phone}
                  </>
                )}
              </address>
            </div>

            <div className={card}>
              <h2 className="mb-5 text-label uppercase tracking-[0.1em] text-ink">
                Billing address
              </h2>
              <address className="not-italic text-body-sm leading-relaxed text-muted">
                {order.billing_address ? (
                  <>
                    {order.billing_address.full_name}
                    <br />
                    {order.billing_address.address_line1}
                    <br />
                    {order.billing_address.city}, {order.billing_address.state}{" "}
                    {order.billing_address.zip}
                    <br />
                    {order.billing_address.country}
                  </>
                ) : (
                  "Same as shipping."
                )}
              </address>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Timeline
            </h2>
            <OrderTimeline entries={timeline} />
          </div>
        </div>

        <aside className="no-print flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Customer
            </h2>
            <div className="flex flex-col gap-2 text-body-sm">
              <span className="text-ink">
                {customer?.full_name ?? order.shipping_address.full_name}
              </span>
              <a
                href={`mailto:${order.email}`}
                className="text-accent underline underline-offset-4"
              >
                {order.email}
              </a>
              {(customer?.phone ?? order.shipping_address.phone) && (
                <span className="text-muted">
                  {customer?.phone ?? order.shipping_address.phone}
                </span>
              )}
              {customer && (
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="mt-2 text-caption normal-case tracking-normal text-accent underline underline-offset-4"
                >
                  View customer profile
                </Link>
              )}
              {!order.user_id && (
                <span className="mt-2 text-caption normal-case tracking-normal text-muted">
                  Guest checkout
                </span>
              )}
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Status
            </h2>
            <div className="flex flex-col gap-5">
              <Select
                label="Fulfillment"
                value={fulfillment}
                onChange={(e) => setFulfillment(e.target.value as FulfillmentStatus)}
              >
                {FULFILLMENT.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>

              <Select
                label="Payment"
                value={payment}
                onChange={(e) => setPayment(e.target.value as PaymentStatus)}
              >
                {PAYMENT.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>

              <Textarea
                label="Timeline note"
                rows={3}
                value={note}
                hint="Added to the timeline alongside the status change."
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Shipping
            </h2>
            <div className="flex flex-col gap-5">
              <Input
                label="Carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
              <Input
                label="Tracking number"
                value={trackingNumber}
                hint="Visible to the customer on their order page."
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
              Payment
            </h2>
            <dl className="flex flex-col gap-3 text-body-sm">
              <div>
                <dt className="text-caption uppercase tracking-[0.1em] text-muted">
                  Method
                </dt>
                <dd className="mt-1 text-ink">Razorpay</dd>
              </div>
              <div>
                <dt className="text-caption uppercase tracking-[0.1em] text-muted">
                  Razorpay order
                </dt>
                <dd className="mt-1 break-all text-ink">
                  {order.razorpay_order_id ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-caption uppercase tracking-[0.1em] text-muted">
                  Payment id
                </dt>
                <dd className="mt-1 break-all text-ink">
                  {order.razorpay_payment_id ?? "—"}
                </dd>
              </div>
            </dl>
          </div>

          <Button onClick={saveChanges} loading={saving} fullWidth>
            Save changes
          </Button>
        </aside>
      </div>

      {/* Print-only header so a printed page identifies itself. */}
      <div className="hidden print:mt-8 print:block print:border-t print:border-hairline print:pt-4">
        <p className="text-caption normal-case tracking-normal text-muted">
          {siteName} · {packingSlip ? "Packing slip" : "Invoice"} {order.order_number} ·{" "}
          {formatDate(order.created_at)}
        </p>
      </div>
    </>
  );
}
