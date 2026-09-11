import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { getDemoOrder } from "@/lib/demo/orders";
import { ButtonLink } from "@/components/ui/Button";
import { AnimatedCheck } from "@/components/storefront/AnimatedCheck";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSiteSettings } from "@/lib/queries";
import type { OrderWithItems } from "@/types";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: { orderNumber: string };
  searchParams: { pending?: string };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: PageProps) {
  const orderNumber = decodeURIComponent(params.orderNumber);

  let order: OrderWithItems | null;

  // Demo orders are matched first: in development the checkout may have
  // written one even though Supabase credentials are present but unseeded.
  const demoOrder = getDemoOrder(orderNumber);

  if (isDemoMode() || demoOrder) {
    order = demoOrder;
  } else {
    // Read via the service role: a guest checkout has no session, so RLS would
    // hide their own order from them. The order number is the capability here.
    const admin = createAdminClient();
    const { data } = await admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();
    order = data as OrderWithItems | null;
  }

  if (!order) notFound();

  const settings = await getSiteSettings();
  const symbol = settings?.currency_symbol ?? "₹";
  const code = settings?.currency_code ?? "INR";
  const money = (n: number) => formatCurrency(Number(n), symbol, code);

  const estimatedDelivery = new Date(order.created_at);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 6);

  const isPending = searchParams.pending === "1" || order.payment_status === "pending";

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <AnimatedCheck />

        <h1 className="mt-8 font-serif text-section-sm leading-tight text-ink md:text-section">
          {isPending ? "Order received" : "Thank you for your order"}
        </h1>

        <p className="mt-4 text-body leading-relaxed text-muted">
          {isPending
            ? "Your order is saved and awaiting payment confirmation. We'll email you as soon as it clears."
            : `We've emailed a confirmation to ${order.email}. Your order is being prepared.`}
        </p>

        <div className="mt-10 inline-flex flex-col items-center gap-1 rounded-sm bg-cream px-8 py-6">
          <span className="label-caps">Order number</span>
          <span className="font-serif text-2xl text-ink">{order.order_number}</span>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-2xl">
        <div className="card-surface overflow-hidden">
          <div className="grid gap-6 border-b border-hairline p-8 sm:grid-cols-3">
            <div>
              <span className="label-caps">Placed</span>
              <p className="mt-2 text-body-sm text-ink">
                {formatDate(order.created_at)}
              </p>
            </div>
            <div>
              <span className="label-caps">Estimated delivery</span>
              <p className="mt-2 text-body-sm text-ink">
                {formatDate(estimatedDelivery.toISOString())}
              </p>
            </div>
            <div>
              <span className="label-caps">Payment</span>
              <p className="mt-2 text-body-sm capitalize text-ink">
                {order.payment_status}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-hairline">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex gap-4 p-8">
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
                  <p className="font-serif text-lg text-ink">{item.title}</p>
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

          <dl className="flex flex-col gap-4 border-t border-hairline bg-cream/40 p-8 text-body-sm">
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
              <dt className="text-muted">
                Shipping{order.shipping_method ? ` · ${order.shipping_method}` : ""}
              </dt>
              <dd className="text-ink tabular-nums">
                {Number(order.shipping_cost) === 0 ? "Free" : money(order.shipping_cost)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Tax</dt>
              <dd className="text-ink tabular-nums">{money(order.tax_amount)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-hairline pt-4">
              <dt className="text-label uppercase tracking-[0.1em] text-ink">Total</dt>
              <dd className="font-serif text-2xl text-ink tabular-nums">
                {money(order.total)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/products" size="lg">
            Continue shopping
          </ButtonLink>
          <ButtonLink href="/account/orders" variant="secondary" size="lg">
            Track order
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
