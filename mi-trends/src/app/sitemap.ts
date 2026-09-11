import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 3600;

/** Auto-generated from the live catalogue plus the static pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false }),
    supabase.from("categories").select("slug, created_at"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/shipping-policy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/returns-policy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy-policy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = (
    (products as { slug: string; updated_at: string }[]) ?? []
  ).map((product) => ({
    url: absoluteUrl(`/products/${product.slug}`),
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (
    (categories as { slug: string; created_at: string }[]) ?? []
  ).map((category) => ({
    url: absoluteUrl(`/products?category=${category.slug}`),
    lastModified: new Date(category.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
