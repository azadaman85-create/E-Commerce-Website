import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, Package, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, FulfillmentBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { getSiteSettings } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Address, OrderWithItems } from "@/types";

export const metadata: Metadata = {
  title: "Account overview",
  robots: { index: false },
};

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: orderRows }, { data: addressRows }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user!.id)
      .order("is_default", { ascending: false })
      .limit(2),
    getSiteSettings(),
  ]);

  const orders = (orderRows as OrderWithItems[]) ?? [];
  const addresses = (addressRows as Address[]) ?? [];

  const symbol = settings?.currency_symbol ?? "₹";
  const code = settings?.currency_code ?? "INR";
  const money = (n: number) => formatCurrency(Number(n), symbol, code);

  const lifetimeSpend = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const stats = [
    { label: "Recent orders", value: String(orders.length), Icon: Package },
    { label: "Saved addresses", value: String(addresses.length), Icon: MapPin },
    { label: "Recent spend", value: money(lifetimeSpend), Icon: Wallet },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="card-surface p-6">
            <Icon className="h-5 w-5 text-muted" strokeWidth={1.5} aria-hidden />
            <p className="mt-4 font-serif text-2xl text-ink">{value}</p>
            <p className="mt-1 text-caption normal-case tracking-normal text-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink">Recent orders</h2>
          <Link
            href="/account/orders"
            className="group inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
          >
            View all
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="card-surface">
            <EmptyState
              illustration="orders"
              title="No orders yet"
              description="When you place an order it will appear here."
              action={
                <ButtonLink href="/products" variant="dark">
                  Start shopping
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.order_number}`}
                  className="card-surface flex flex-wrap items-center justify-between gap-4 p-6 transition-shadow hover:shadow-card-hover"
                >
                  <div>
                    <span className="font-serif text-lg text-ink">
                      {order.order_number}
                    </span>
                    <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                      {formatDate(order.created_at)} ·{" "}
                      {order.order_items.length} item
                      {order.order_items.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <FulfillmentBadge status={order.fulfillment_status} />
                    <Badge
                      tone={order.payment_status === "paid" ? "success" : "warning"}
                    >
                      {order.payment_status}
                    </Badge>
                    <span className="text-body-sm font-medium text-ink">
                      {money(order.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink">Saved addresses</h2>
          <Link
            href="/account/addresses"
            className="group inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
          >
            Manage
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-body-sm text-muted">
              No saved addresses yet — add one to speed up checkout.
            </p>
            <div className="mt-6">
              <ButtonLink href="/account/addresses" variant="secondary">
                Add an address
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="card-surface p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-body-sm font-medium text-ink">
                    {address.full_name}
                  </span>
                  {address.is_default && <Badge tone="accent">Default</Badge>}
                </div>
                <address className="mt-3 not-italic text-body-sm leading-relaxed text-muted">
                  {address.address_line1}
                  <br />
                  {address.city}, {address.state} {address.zip}
                  <br />
                  {address.country}
                </address>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
