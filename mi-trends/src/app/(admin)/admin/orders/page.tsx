import { createAdminClient } from "@/lib/supabase/admin";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { getSiteSettings } from "@/lib/queries";
import type { OrderWithItems } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  // The layout has already verified the caller is an admin.
  const admin = createAdminClient();

  const [{ data }, settings] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(id, quantity)")
      .order("created_at", { ascending: false })
      .limit(500),
    getSiteSettings(),
  ]);

  return (
    <OrdersTable
      orders={(data as unknown as OrderWithItems[]) ?? []}
      currencySymbol={settings?.currency_symbol ?? "₹"}
      currencyCode={settings?.currency_code ?? "INR"}
    />
  );
}
