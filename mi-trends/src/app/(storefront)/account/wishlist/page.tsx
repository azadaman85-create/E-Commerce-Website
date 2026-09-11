import type { Metadata } from "next";
import { WishlistGrid } from "@/components/storefront/WishlistGrid";
import { createClient } from "@/lib/supabase/server";
import { getRatingsFor } from "@/lib/queries";
import type { ProductWithRelations } from "@/types";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default async function WishlistPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("wishlist")
    .select(
      `product_id,
       products(*, categories(id, name, slug), product_images(*), product_variants(*))`,
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as {
    product_id: string;
    products: ProductWithRelations | null;
  }[];

  // A wishlisted product may since have been deleted or unpublished.
  const products = rows
    .map((row) => row.products)
    .filter((p): p is ProductWithRelations => p !== null && p.status === "active")
    .map((p) => ({
      ...p,
      product_images: (p.product_images ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));

  const ratingMap = await getRatingsFor(products.map((p) => p.id));

  return (
    <WishlistGrid products={products} ratings={Object.fromEntries(ratingMap)} />
  );
}
