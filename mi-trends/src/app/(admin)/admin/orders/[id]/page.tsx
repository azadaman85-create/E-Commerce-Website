import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderDetail } from "@/components/admin/OrderDetail";
import { getSiteSettings } from "@/lib/queries";
import type { OrderWithItems, Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();

  const [{ data }, settings] = await Promise.all([
    admin
      .from("orders")
      .select("*, order_items(*), order_timeline(*)")
      .eq("id", params.id)
      .maybeSingle(),
    getSiteSettings(),
  ]);

  const order = data as OrderWithItems | null;
  if (!order) notFound();

  let customer: Profile | null = null;
  if (order.user_id) {
    const { data: profileRow } = await admin
      .from("profiles")
      .select("*")
      .eq("id", order.user_id)
      .maybeSingle();
    customer = (profileRow as Profile) ?? null;
  }

  return (
    <OrderDetail
      order={order}
      customer={customer}
      siteName={settings?.site_name ?? "MI TRENDS"}
      currencySymbol={settings?.currency_symbol ?? "₹"}
      currencyCode={settings?.currency_code ?? "INR"}
    />
  );
}
