import { createAdminClient } from "@/lib/supabase/admin";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { getCategories, getSiteSettings } from "@/lib/queries";
import type { Coupon } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const admin = createAdminClient();

  const [{ data }, { data: products }, categories, settings] = await Promise.all([
    admin.from("coupons").select("*").order("created_at", { ascending: false }),
    admin.from("products").select("id, title").order("title"),
    getCategories(),
    getSiteSettings(),
  ]);

  return (
    <CouponsManager
      coupons={(data as Coupon[]) ?? []}
      products={(products as { id: string; title: string }[]) ?? []}
      categories={categories}
      currencySymbol={settings?.currency_symbol ?? "₹"}
      currencyCode={settings?.currency_code ?? "INR"}
    />
  );
}
