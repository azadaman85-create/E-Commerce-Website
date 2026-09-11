"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/admin/AdminUI";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/analytics";

const RevenueChart = dynamic(
  () => import("@/components/admin/Charts").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> },
);
const OrdersChart = dynamic(
  () => import("@/components/admin/Charts").then((m) => m.OrdersChart),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> },
);
const TopProductsChart = dynamic(
  () => import("@/components/admin/Charts").then((m) => m.TopProductsChart),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> },
);
const CategoryPie = dynamic(
  () => import("@/components/admin/Charts").then((m) => m.CategoryPie),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> },
);

export function AnalyticsClient({
  data,
  currencySymbol,
  currencyCode,
}: {
  data: DashboardData;
  currencySymbol: string;
  currencyCode: string;
}) {
  const money = (n: number) => formatCurrency(n, currencySymbol, currencyCode);
  const moneyCompact = (n: number) =>
    `${currencySymbol}${new Intl.NumberFormat(currencyCode === "INR" ? "en-IN" : "en-US", {
      notation: n >= 100000 ? "compact" : "standard",
      maximumFractionDigits: 0,
    }).format(n)}`;

  // Signups reuse the orders chart shape, so map count -> orders.
  const signupSeries = data.customerSignups.map((point) => ({
    date: point.date,
    revenue: 0,
    orders: point.count,
  }));

  const topByRevenue = [...data.topProducts]
    .sort((a, b) => b.revenue - a.revenue)
    .map((p) => ({ name: p.name, units: Math.round(p.revenue) }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (30d)" value={data.revenue} format={money} change={data.revenueChange} />
        <StatCard label="Orders (30d)" value={data.orderCount} change={data.orderChange} />
        <StatCard label="Customers" value={data.customerCount} change={data.customerChange} />
        <StatCard
          label="Avg order value"
          value={data.avgOrderValue}
          format={money}
          change={data.aovChange}
        />
      </div>

      <RevenueChart data={data.series} formatCurrency={moneyCompact} />

      <div className="grid gap-6 xl:grid-cols-2">
        <OrdersChart data={data.series} />
        <CategoryPie data={data.categoryRevenue} formatCurrency={money} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TopProductsChart data={data.topProducts} title="Top products by units sold" />
        <TopProductsChart data={topByRevenue} title="Top products by revenue" />
      </div>

      <div className="card-surface p-6">
        <h2 className="mb-6 text-label uppercase tracking-[0.1em] text-ink">
          Customer acquisition
        </h2>
        <OrdersChart data={signupSeries} />
      </div>
    </div>
  );
}
