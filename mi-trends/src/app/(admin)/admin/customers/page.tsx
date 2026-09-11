import { createAdminClient } from "@/lib/supabase/admin";
import { CustomersTable } from "@/components/admin/CustomersTable";
import { getSiteSettings } from "@/lib/queries";
import { round2 } from "@/lib/utils";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export interface CustomerRow extends Profile {
  orderCount: number;
  totalSpent: number;
}

export default async function AdminCustomersPage() {
  const admin = createAdminClient();

  const [{ data: profileRows }, { data: orderRows }, settings] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("orders").select("user_id, total, payment_status"),
    getSiteSettings(),
  ]);

  const totals = new Map<string, { count: number; spent: number }>();
  for (const order of (orderRows ?? []) as {
    user_id: string | null;
    total: number;
    payment_status: string;
  }[]) {
    if (!order.user_id) continue;
    const entry = totals.get(order.user_id) ?? { count: 0, spent: 0 };
    entry.count += 1;
    // Lifetime value counts captured payments only.
    if (order.payment_status === "paid") {
      entry.spent = round2(entry.spent + Number(order.total));
    }
    totals.set(order.user_id, entry);
  }

  const customers: CustomerRow[] = ((profileRows as Profile[]) ?? []).map((profile) => ({
    ...profile,
    orderCount: totals.get(profile.id)?.count ?? 0,
    totalSpent: totals.get(profile.id)?.spent ?? 0,
  }));

  return (
    <CustomersTable
      customers={customers}
      currencySymbol={settings?.currency_symbol ?? "₹"}
      currencyCode={settings?.currency_code ?? "INR"}
    />
  );
}
