import { createAdminClient } from "@/lib/supabase/admin";
import { ReturnsManager } from "@/components/admin/ReturnsManager";
import { getSiteSettings } from "@/lib/queries";
import type { ReturnRequest } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  const admin = createAdminClient();

  const [{ data }, settings] = await Promise.all([
    admin.from("returns").select("*").order("created_at", { ascending: false }),
    getSiteSettings(),
  ]);

  return (
    <ReturnsManager
      returns={(data as ReturnRequest[]) ?? []}
      currencySymbol={settings?.currency_symbol ?? "₹"}
      currencyCode={settings?.currency_code ?? "INR"}
    />
  );
}
