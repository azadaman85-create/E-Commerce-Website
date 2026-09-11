import { createAdminClient } from "@/lib/supabase/admin";
import { round2 } from "@/lib/utils";
import type { FulfillmentStatus, PaymentStatus } from "@/types";

export interface DashboardOrder {
  id: string;
  order_number: string;
  email: string;
  total: number;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  shipping_address: { full_name?: string } | null;
}

export interface DashboardData {
  revenue: number;
  revenueChange: number | null;
  orderCount: number;
  orderChange: number | null;
  customerCount: number;
  customerChange: number | null;
  avgOrderValue: number;
  aovChange: number | null;
  series: { date: string; revenue: number; orders: number }[];
  recentOrders: DashboardOrder[];
  topProducts: { name: string; units: number; revenue: number }[];
  lowStock: { id: string; title: string; stock_quantity: number; sku: string | null }[];
  categoryRevenue: { name: string; value: number }[];
  customerSignups: { date: string; count: number }[];
}

function percentChange(current: number, previous: number): number | null {
  // A jump from zero has no meaningful percentage.
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

/**
 * Aggregates everything the dashboard and analytics pages need in one pass.
 * Uses the service role because the callers have already verified the
 * requester is an admin.
 */
export async function getDashboardData(days = 365): Promise<DashboardData> {
  const admin = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [{ data: orderRows }, { data: itemRows }, { data: profileRows }, { data: productRows }] =
    await Promise.all([
      admin
        .from("orders")
        .select(
          "id, order_number, email, total, payment_status, fulfillment_status, created_at, shipping_address",
        )
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }),
      admin
        .from("order_items")
        .select("product_id, title, quantity, line_total, order_id, products(category_id)"),
      admin.from("profiles").select("id, created_at"),
      admin
        .from("products")
        .select("id, title, stock_quantity, sku, category_id, track_inventory")
        .eq("status", "active"),
    ]);

  const orders = (orderRows ?? []) as unknown as DashboardOrder[];
  const paidOrders = orders.filter((o) => o.payment_status === "paid");

  // ---- Period comparison: current window vs the one immediately before ----
  const windowDays = Math.min(days, 30);
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);
  const previousStart = new Date();
  previousStart.setDate(previousStart.getDate() - windowDays * 2);

  const inWindow = paidOrders.filter(
    (o) => new Date(o.created_at) >= windowStart,
  );
  const inPrevious = paidOrders.filter((o) => {
    const at = new Date(o.created_at);
    return at >= previousStart && at < windowStart;
  });

  const sum = (list: DashboardOrder[]) =>
    round2(list.reduce((total, o) => total + Number(o.total), 0));

  const currentRevenue = sum(inWindow);
  const previousRevenue = sum(inPrevious);

  const currentAov = inWindow.length ? currentRevenue / inWindow.length : 0;
  const previousAov = inPrevious.length ? previousRevenue / inPrevious.length : 0;

  const profiles = (profileRows ?? []) as { id: string; created_at: string }[];
  const currentCustomers = profiles.filter(
    (p) => new Date(p.created_at) >= windowStart,
  ).length;
  const previousCustomers = profiles.filter((p) => {
    const at = new Date(p.created_at);
    return at >= previousStart && at < windowStart;
  }).length;

  // ---- Daily series ------------------------------------------------------
  const seriesMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    seriesMap.set(dayKey(date), { revenue: 0, orders: 0 });
  }
  for (const order of paidOrders) {
    const key = dayKey(order.created_at);
    const entry = seriesMap.get(key);
    if (entry) {
      entry.revenue = round2(entry.revenue + Number(order.total));
      entry.orders += 1;
    }
  }
  const series = [...seriesMap.entries()].map(([date, value]) => ({
    date: date.slice(5), // MM-DD reads better on a dense axis
    revenue: value.revenue,
    orders: value.orders,
  }));

  // ---- Top products, restricted to paid orders ---------------------------
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));
  type ItemRow = {
    product_id: string | null;
    title: string;
    quantity: number;
    line_total: number;
    order_id: string;
    products: { category_id: string | null } | null;
  };
  const items = ((itemRows ?? []) as unknown as ItemRow[]).filter((item) =>
    paidOrderIds.has(item.order_id),
  );

  const productTotals = new Map<string, { name: string; units: number; revenue: number }>();
  const categoryTotals = new Map<string, number>();

  for (const item of items) {
    const key = item.product_id ?? item.title;
    const entry = productTotals.get(key) ?? { name: item.title, units: 0, revenue: 0 };
    entry.units += item.quantity;
    entry.revenue = round2(entry.revenue + Number(item.line_total));
    productTotals.set(key, entry);

    const categoryId = item.products?.category_id;
    if (categoryId) {
      categoryTotals.set(
        categoryId,
        round2((categoryTotals.get(categoryId) ?? 0) + Number(item.line_total)),
      );
    }
  }

  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      // Truncate so long product names do not squeeze the chart plot area.
      name: p.name.length > 22 ? `${p.name.slice(0, 21)}…` : p.name,
    }));

  // ---- Category revenue --------------------------------------------------
  const { data: categoryRows } = await admin.from("categories").select("id, name");
  const categoryNames = new Map(
    ((categoryRows ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]),
  );
  const categoryRevenue = [...categoryTotals.entries()]
    .map(([id, value]) => ({ name: categoryNames.get(id) ?? "Uncategorised", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // ---- Low stock ---------------------------------------------------------
  const lowStock = ((productRows ?? []) as {
    id: string;
    title: string;
    stock_quantity: number;
    sku: string | null;
    track_inventory: boolean;
  }[])
    .filter((p) => p.track_inventory && p.stock_quantity < 10)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 8);

  // ---- Signups over time -------------------------------------------------
  const signupMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    signupMap.set(dayKey(date), 0);
  }
  for (const p of profiles) {
    const key = dayKey(p.created_at);
    if (signupMap.has(key)) signupMap.set(key, (signupMap.get(key) ?? 0) + 1);
  }

  return {
    revenue: currentRevenue,
    revenueChange: percentChange(currentRevenue, previousRevenue),
    orderCount: inWindow.length,
    orderChange: percentChange(inWindow.length, inPrevious.length),
    customerCount: profiles.length,
    customerChange: percentChange(currentCustomers, previousCustomers),
    avgOrderValue: round2(currentAov),
    aovChange: percentChange(currentAov, previousAov),
    series,
    recentOrders: orders.slice(0, 10),
    topProducts,
    lowStock,
    categoryRevenue,
    customerSignups: [...signupMap.entries()].map(([date, count]) => ({
      date: date.slice(5),
      count,
    })),
  };
}
