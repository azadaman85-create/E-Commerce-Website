import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { searchProducts } from "@/lib/queries";
import { effectivePrice, isOnSale } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = (searchParams.get("q") ?? "").trim();

  if (term.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Strip characters that carry meaning inside PostgREST's or() filter.
  const safe = term.replace(/[%,()]/g, " ").trim();
  if (!safe) return NextResponse.json({ results: [] });

  if (isDemoMode()) {
    const products = (await searchProducts(safe, 8)) as ProductWithRelations[];
    return NextResponse.json({
      results: products.map((p) => {
        const images = [...(p.product_images ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: Number(p.price),
          salePrice: isOnSale(p) ? effectivePrice(p) : null,
          imageUrl: images[0]?.image_url ?? null,
          categoryName: p.categories?.name ?? null,
        };
      }),
    });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, slug, price, sale_price, sale_start, sale_end, " +
        "product_images(image_url, sort_order), categories(name)",
    )
    .eq("status", "active")
    .or(
      `title.ilike.%${safe}%,short_description.ilike.%${safe}%,description.ilike.%${safe}%`,
    )
    .limit(8);

  if (error) {
    return NextResponse.json({ results: [], error: error.message }, { status: 500 });
  }

  const results = ((data ?? []) as unknown as ProductWithRelations[]).map((p) => {
    const images = [...(p.product_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: Number(p.price),
      salePrice: isOnSale(p) ? effectivePrice(p) : null,
      imageUrl: images[0]?.image_url ?? null,
      categoryName: p.categories?.name ?? null,
    };
  });

  return NextResponse.json({ results });
}
