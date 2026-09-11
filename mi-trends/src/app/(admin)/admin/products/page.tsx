import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { getSiteSettings } from "@/lib/queries";
import type { ProductWithRelations } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createClient();

  // Admin RLS lets this see drafts as well as active products.
  const [{ data }, settings] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(id, name, slug), product_images(image_url, sort_order)")
      .order("created_at", { ascending: false }),
    getSiteSettings(),
  ]);

  return (
    <ProductsTable
      products={(data as unknown as ProductWithRelations[]) ?? []}
      currencySymbol={settings?.currency_symbol ?? "₹"}
      currencyCode={settings?.currency_code ?? "INR"}
    />
  );
}
