import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, FulfillmentBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { getSiteSettings } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderWithItems } from "@/types";

export const metadata: Metadata = {
  title: "Order history",
  robots: { index: false },
};

export default async function OrdersPage() {
  const supabase = createClient();
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false }),
    getSiteSettings(),
  ]);

  const orders = (data as OrderWithItems[]) ?? [];
  const money = (n: number) =>
    formatCurrency(
      Number(n),
      settings?.currency_symbol ?? "₹",
      settings?.currency_code ?? "INR",
    );

  if (orders.length === 0) {
    return (
      <div className="card-surface">
        <EmptyState
          illustration="orders"
          title="No orders yet"
          description="Your order history will appear here once you've placed one."
          action={
            <ButtonLink href="/products" variant="dark">
              Start shopping
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-6">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.order_number}`}
            className="card-surface block overflow-hidden transition-shadow hover:shadow-card-hover"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-cream/40 px-6 py-4">
              <div>
                <span className="font-serif text-lg text-ink">
                  {order.order_number}
                </span>
                <p className="mt-0.5 text-caption normal-case tracking-normal text-muted">
                  Placed {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FulfillmentBadge status={order.fulfillment_status} />
                <Badge tone={order.payment_status === "paid" ? "success" : "warning"}>
                  {order.payment_status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
              </div>
            </div>

            <div className="flex items-center gap-6 p-6">
              <div className="flex -space-x-3">
                {order.order_items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm border-2 border-white bg-cream"
                  >
                    {item.image_url && (
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
                {order.order_items.length > 4 && (
                  <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-white bg-cream text-caption normal-case tracking-normal text-muted">
                    +{order.order_items.length - 4}
                  </div>
                )}
              </div>

              <div className="ml-auto text-right">
                <span className="block text-caption normal-case tracking-normal text-muted">
                  {order.order_items.reduce((sum, i) => sum + i.quantity, 0)} item
                  {order.order_items.length === 1 ? "" : "s"}
                </span>
                <span className="mt-1 block font-serif text-xl text-ink">
                  {money(order.total)}
                </span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
