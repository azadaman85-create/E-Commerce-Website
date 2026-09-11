import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const [categories, { data: counts }] = await Promise.all([
    getCategories(),
    supabase.from("products").select("category_id"),
  ]);

  // Product counts per category, so deleting one shows what it affects.
  const productCounts: Record<string, number> = {};
  for (const row of (counts as { category_id: string | null }[]) ?? []) {
    if (row.category_id) {
      productCounts[row.category_id] = (productCounts[row.category_id] ?? 0) + 1;
    }
  }

  return <CategoriesManager categories={categories} productCounts={productCounts} />;
}
