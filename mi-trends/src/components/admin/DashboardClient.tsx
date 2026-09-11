"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, IndianRupee, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/admin/AdminUI";
import { FulfillmentBadge, PaymentBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardData } from "@/lib/analytics";

// Recharts is heavy — keep it out of the initial admin bundle.
const RevenueChart = dynamic(
  () => import("@/components/admin/Charts").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> },
);
const TopProductsChart = dynamic(
  () => import("@/components/admin/Charts").then((m) => m.TopProductsChart),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> },
);

export function DashboardClient({
  data,
  currencySymbol,
  currencyCode,
}: {
  data: DashboardData;
  currencySymbol: string;
  currencyCode: string;
}) {
  const money = (n: number) => formatCurrency(n, currencySymbol, currencyCode);
  // Axis labels need to stay short, so drop the decimals there.
  const moneyCompact = (n: number) =>
    `${currencySymbol}${new Intl.NumberFormat(currencyCode === "INR" ? "en-IN" : "en-US", {
      notation: n >= 100000 ? "compact" : "standard",
      maximumFractionDigits: 0,
    }).format(n)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={data.revenue}
          format={money}
          change={data.revenueChange}
          icon={<IndianRupee className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Orders"
          value={data.orderCount}
          change={data.orderChange}
          icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Customers"
          value={data.customerCount}
          change={data.customerChange}
          icon={<Users className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Avg order value"
          value={data.avgOrderValue}
          format={money}
          change={data.aovChange}
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        />
      </div>

      <RevenueChart data={data.series} formatCurrency={moneyCompact} />

      <div className="grid gap-6 xl:grid-cols-2">
        <TopProductsChart data={data.topProducts} />

        <div className="card-surface p-6">
          <div className="mb-6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#B45309]" aria-hidden />
            <h2 className="text-label uppercase tracking-[0.1em] text-ink">
              Low stock
            </h2>
          </div>

          {data.lowStock.length === 0 ? (
            <p className="py-12 text-center text-body-sm text-muted">
              Everything is comfortably in stock.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline">
              {data.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="block truncate text-body-sm text-ink transition-colors hover:text-accent"
                    >
                      {product.title}
                    </Link>
                    {product.sku && (
                      <span className="text-caption normal-case tracking-normal text-muted">
                        {product.sku}
                      </span>
                    )}
                  </div>
                  <span
                    className={
                      product.stock_quantity === 0
                        ? "shrink-0 text-body-sm font-medium text-danger"
                        : "shrink-0 text-body-sm font-medium text-[#B45309]"
                    }
                  >
                    {product.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <h2 className="text-label uppercase tracking-[0.1em] text-ink">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-caption normal-case tracking-normal text-accent underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {data.recentOrders.length === 0 ? (
          <p className="py-16 text-center text-body-sm text-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-hairline bg-cream/50">
                  {["Order", "Customer", "Date", "Payment", "Fulfillment", "Total"].map(
                    (header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-6 py-3 text-caption uppercase tracking-[0.1em] text-muted"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-hairline transition-colors last:border-0 hover:bg-cream/40"
                  >
                    <td className="px-6 py-3 text-body-sm">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-ink transition-colors hover:text-accent"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-body-sm text-muted">
                      {order.shipping_address?.full_name ?? order.email}
                    </td>
                    <td className="px-6 py-3 text-body-sm text-muted">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-3">
                      <PaymentBadge status={order.payment_status} />
                    </td>
                    <td className="px-6 py-3">
                      <FulfillmentBadge status={order.fulfillment_status} />
                    </td>
                    <td className="px-6 py-3 text-body-sm text-ink tabular-nums">
                      {money(Number(order.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
