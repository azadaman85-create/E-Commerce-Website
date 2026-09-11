import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";
import type { ProductWithRelations } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data }, categories] = await Promise.all([
    supabase
      .from("products")
      .select(
        `*,
         product_images(*),
         product_options(*, product_option_values(*)),
         product_variants(*)`,
      )
      .eq("id", params.id)
      .maybeSingle(),
    getCategories(),
  ]);

  if (!data) notFound();

  const product = data as unknown as ProductWithRelations;
  product.product_options = (product.product_options ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((option) => ({
      ...option,
      product_option_values: (option.product_option_values ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));

  return <ProductForm product={product} categories={categories} />;
}
