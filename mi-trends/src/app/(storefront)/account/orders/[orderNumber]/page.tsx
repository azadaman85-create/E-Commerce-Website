import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, FulfillmentBadge } from "@/components/ui/Badge";
import { OrderTimeline } from "@/components/storefront/OrderTimeline";
import { ReturnRequest } from "@/components/storefront/ReturnRequest";
import { checkReturnEligibility } from "@/lib/returns";
import { getSiteSettings } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderWithItems, ReturnRequest as ReturnRecord } from "@/types";

export const metadata: Metadata = {
  title: "Order detail",
  robots: { index: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const supabase = createClient();

  // RLS scopes this to the signed-in customer's own orders.
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*), order_timeline(*)")
      .eq("order_number", decodeURIComponent(params.orderNumber))
      .maybeSingle(),
    getSiteSettings(),
  ]);

  const order = data as OrderWithItems | null;
  if (!order) notFound();

  // RLS scopes this to the customer's own returns.
  const { data: returnRows } = await supabase
    .from("returns")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const existingReturn = ((returnRows as ReturnRecord[]) ?? [])[0] ?? null;
  const openStatuses = ["requested", "approved"];
  const eligibility = checkReturnEligibility(
    order,
    existingReturn !== null && openStatuses.includes(existingReturn.status),
  );

  const money = (n: number) =>
    formatCurrency(
      Number(n),
      settings?.currency_symbol ?? "₹",
      settings?.currency_code ?? "INR",
    );

  const timeline = [...(order.order_timeline ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-8 inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="font-serif text-3xl text-ink">{order.order_number}</h2>
          <p className="mt-2 text-body-sm text-muted">
            Placed {formatDate(order.created_at, true)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FulfillmentBadge status={order.fulfillment_status} />
          <Badge tone={order.payment_status === "paid" ? "success" : "warning"}>
            {order.payment_status}
          </Badge>
        </div>
      </div>

      {order.tracking_number && (
        <div className="mt-8 flex items-start gap-4 rounded-sm border border-accent/25 bg-accent/4 p-6">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-body-sm font-medium text-ink">
              On its way with {order.tracking_carrier ?? "our carrier"}
            </p>
            <p className="mt-1 text-body-sm text-muted">
              Tracking number:{" "}
              <span className="font-medium text-ink">{order.tracking_number}</span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div>
          <h3 className="label-caps">Items</h3>
          <ul className="mt-4 flex flex-col divide-y divide-hairline border-y border-hairline">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-cream">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {item.slug ? (
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-serif text-lg text-ink transition-colors hover:text-accent"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="font-serif text-lg text-ink">{item.title}</span>
                  )}
                  {item.variant_info && item.variant_info.length > 0 && (
                    <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                      {item.variant_info
                        .map((v) => `${v.option_name}: ${v.value}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                    Qty {item.quantity} × {money(item.unit_price)}
                  </p>
                </div>
                <span className="text-body-sm text-ink">{money(item.line_total)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <h3 className="label-caps">Status</h3>
            <div className="mt-6">
              <OrderTimeline entries={timeline} />
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-8">
          <div className="card-surface p-6">
            <h3 className="label-caps">Summary</h3>
            <dl className="mt-5 flex flex-col gap-3 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink tabular-nums">{money(order.subtotal)}</dd>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">
                    Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </dt>
                  <dd className="text-success tabular-nums">
                    −{money(order.discount_amount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="text-ink tabular-nums">
                  {Number(order.shipping_cost) === 0
                    ? "Free"
                    : money(order.shipping_cost)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="text-ink tabular-nums">{money(order.tax_amount)}</dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-hairline pt-4">
                <dt className="text-label uppercase tracking-[0.1em] text-ink">
                  Total
                </dt>
                <dd className="font-serif text-xl text-ink tabular-nums">
                  {money(order.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card-surface p-6">
            <h3 className="label-caps">Shipping address</h3>
            <address className="mt-4 not-italic text-body-sm leading-relaxed text-muted">
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
            </address>
          </div>

          <ReturnRequest
            orderId={order.id}
            items={order.order_items}
            eligibility={eligibility}
            existing={existingReturn}
          />
        </aside>
      </div>
    </div>
  );
}
