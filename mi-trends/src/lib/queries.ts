import { createClient } from "@/lib/supabase/server";
import {
  demoCategories,
  demoHeroSlides,
  demoProducts,
  demoSettings,
  demoShippingMethods,
  demoSocialPosts,
  demoTestimonials,
  getDemoProductBySlug,
  getDemoRatings,
  getDemoReviews,
  isDemoMode,
  shouldFallBackToDemo,
} from "@/lib/demo";
import { effectivePrice } from "@/lib/utils";
import type {
  Category,
  Gender,
  HeroSlide,
  Product,
  ProductWithRelations,
  Review,
  SeoSettings,
  ShippingMethod,
  SiteSettings,
  SocialPost,
  Testimonial,
} from "@/types";

export { buildCategoryTree } from "@/lib/categories";

const PRODUCT_CARD_SELECT =
  "id, title, slug, price, sale_price, sale_start, sale_end, sku, stock_quantity, " +
  "track_inventory, allow_backorders, status, short_description, category_id, gender, " +
  "tags, units_sold, created_at, updated_at, description, meta_title, meta_description, " +
  "og_image_url, product_images(id, product_id, image_url, sort_order, alt_text), " +
  "categories(id, name, slug)";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  if (isDemoMode()) return demoSettings;

  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  return (data as SiteSettings) ?? demoSettings;
}

export async function getSeoSettings(): Promise<SeoSettings | null> {
  if (isDemoMode()) return null;

  const supabase = createClient();
  const { data } = await supabase.from("seo_settings").select("*").limit(1).maybeSingle();
  return (data as SeoSettings) ?? null;
}

export async function getPageSeo(slug: string) {
  if (isDemoMode()) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("page_seo")
    .select("*")
    .eq("page_slug", slug)
    .maybeSingle();
  return data;
}

export async function getCategories(): Promise<Category[]> {
  if (isDemoMode()) return demoCategories;

  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const rows = (data as Category[]) ?? [];
  return rows.length > 0 ? rows : demoCategories;
}

/** Categories that actually have a product in the given section. */
export async function getCategoriesForGender(gender?: Gender): Promise<Category[]> {
  const categories = await getCategories();
  if (!gender) return categories;

  const { products } = await listProducts({ gender, perPage: 200 });
  const used = new Set(products.map((p) => p.category_id).filter(Boolean));
  const filtered = categories.filter((c) => used.has(c.id));
  return filtered.length > 0 ? filtered : categories;
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  if (isDemoMode()) return demoHeroSlides;

  const supabase = createClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const rows = (data as HeroSlide[]) ?? [];
  return rows.length > 0 ? rows : demoHeroSlides;
}

export async function getNewArrivals(
  limit = 8,
  gender?: Gender,
): Promise<ProductWithRelations[]> {
  if (isDemoMode()) {
    return demoProducts
      .filter((p) => matchesGender(p.gender, gender))
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit);
  }

  const supabase = createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (gender) query = query.in("gender", [gender, "unisex"]);

  const { data } = await query;
  const rows = (data as unknown as ProductWithRelations[]) ?? [];
  if (shouldFallBackToDemo(rows.length)) {
    return demoProducts
      .filter((p) => matchesGender(p.gender, gender))
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, limit);
  }
  return rows;
}

export async function getBestSellers(
  limit = 8,
  gender?: Gender,
): Promise<ProductWithRelations[]> {
  if (isDemoMode()) {
    return demoProducts
      .filter((p) => matchesGender(p.gender, gender))
      .slice()
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);
  }

  const supabase = createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("status", "active")
    .order("units_sold", { ascending: false })
    .limit(limit);

  if (gender) query = query.in("gender", [gender, "unisex"]);

  const { data } = await query;
  const rows = (data as unknown as ProductWithRelations[]) ?? [];
  if (shouldFallBackToDemo(rows.length)) {
    return demoProducts
      .filter((p) => matchesGender(p.gender, gender))
      .slice()
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);
  }
  return rows;
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithRelations | null> {
  if (isDemoMode()) return getDemoProductBySlug(slug);

  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select(
      `*,
       categories(*),
       product_images(*),
       product_options(*, product_option_values(*)),
       product_variants(*)`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return shouldFallBackToDemo(0) ? getDemoProductBySlug(slug) : null;
  }

  const product = data as unknown as ProductWithRelations;
  product.product_images = (product.product_images ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  product.product_options = (product.product_options ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((opt) => ({
      ...opt,
      product_option_values: (opt.product_option_values ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));

  return product;
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 8,
): Promise<ProductWithRelations[]> {
  if (isDemoMode()) {
    const sameCategory = demoProducts.filter(
      (p) => p.id !== excludeId && p.category_id === categoryId,
    );
    // Top up with anything else so the rail is never half-empty.
    const filler = demoProducts.filter(
      (p) => p.id !== excludeId && p.category_id !== categoryId,
    );
    return [...sameCategory, ...filler].slice(0, limit);
  }

  const supabase = createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("status", "active")
    .neq("id", excludeId)
    .limit(limit);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data } = await query;
  const rows = (data as unknown as ProductWithRelations[]) ?? [];
  if (shouldFallBackToDemo(rows.length)) {
    return demoProducts.filter((p) => p.id !== excludeId).slice(0, limit);
  }
  return rows;
}

export interface ReviewSummary {
  average: number;
  total: number;
  /** Count per star, indexed 1–5. */
  breakdown: Record<number, number>;
  reviews: Review[];
}

function summarise(reviews: Review[], declaredTotal?: number): ReviewSummary {
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const review of reviews) {
    breakdown[review.rating] = (breakdown[review.rating] ?? 0) + 1;
    sum += review.rating;
  }

  return {
    average: reviews.length ? sum / reviews.length : 0,
    total: declaredTotal ?? reviews.length,
    breakdown,
    reviews,
  };
}

export async function getProductReviews(productId: string): Promise<ReviewSummary> {
  if (isDemoMode()) {
    const reviews = getDemoReviews(productId);
    const rating = getDemoRatings().get(productId);
    const summary = summarise(reviews);
    // Use the catalogue's headline average so the PDP matches the card.
    return rating
      ? { ...summary, average: rating.average, total: rating.count }
      : summary;
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return summarise((data as Review[]) ?? []);
}

export async function getRatingsFor(
  productIds: string[],
): Promise<Map<string, { average: number; count: number }>> {
  const map = new Map<string, { average: number; count: number }>();
  if (productIds.length === 0) return map;

  if (isDemoMode()) {
    const all = getDemoRatings();
    for (const id of productIds) {
      const entry = all.get(id);
      if (entry) map.set(id, entry);
    }
    return map;
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds);

  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of (data as { product_id: string; rating: number }[]) ?? []) {
    const entry = totals.get(row.product_id) ?? { sum: 0, count: 0 };
    entry.sum += row.rating;
    entry.count += 1;
    totals.set(row.product_id, entry);
  }

  for (const [id, { sum, count }] of totals) {
    map.set(id, { average: sum / count, count });
  }
  return map;
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  if (isDemoMode()) return demoShippingMethods;

  const supabase = createClient();
  const { data } = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const rows = (data as ShippingMethod[]) ?? [];
  return rows.length > 0 ? rows : demoShippingMethods;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (isDemoMode()) return demoTestimonials;

  const supabase = createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const rows = (data as Testimonial[]) ?? [];
  return rows.length > 0 ? rows : demoTestimonials;
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  if (isDemoMode()) return demoSocialPosts;

  const supabase = createClient();
  const { data } = await supabase
    .from("social_posts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const rows = (data as SocialPost[]) ?? [];
  return rows.length > 0 ? rows : demoSocialPosts;
}

export interface ProductFilters {
  category?: string;
  /** Section filter. "unisex" products appear in both men and women. */
  gender?: Gender;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colours?: string[];
  minRating?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  perPage?: number;
  search?: string;
}

export interface ProductListResult {
  products: ProductWithRelations[];
  total: number;
  priceBounds: { min: number; max: number };
}

/** Unisex stock shows in every section. */
function matchesGender(productGender: Gender, filter?: Gender): boolean {
  if (!filter) return true;
  return productGender === filter || productGender === "unisex";
}

/** In-memory equivalent of the PLP query, used in demo mode. */
function listDemoProducts(filters: ProductFilters): ProductListResult {
  const prices = demoProducts.map((p) => Number(p.price));
  const priceBounds = {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };

  const ratings = getDemoRatings();
  let results = demoProducts.filter((product) => {
    if (!matchesGender(product.gender, filters.gender)) return false;

    if (filters.category) {
      const category = demoCategories.find((c) => c.slug === filters.category);
      if (!category || product.category_id !== category.id) return false;
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      const haystack =
        `${product.title} ${product.short_description ?? ""} ${(product.tags ?? []).join(" ")}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    const price = Number(product.price);
    if (filters.minPrice !== undefined && price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;

    if (filters.inStock && product.stock_quantity <= 0) return false;

    if (filters.minRating && filters.minRating > 0) {
      const rating = ratings.get(product.id)?.average ?? 0;
      if (rating < filters.minRating) return false;
    }

    const optionFilters = [...(filters.sizes ?? []), ...(filters.colours ?? [])];
    if (optionFilters.length > 0) {
      const variants = product.product_variants ?? [];
      const sizeOk =
        !filters.sizes?.length ||
        variants.some((v) =>
          v.option_values.some(
            (ov) => ov.option_name === "Size" && filters.sizes!.includes(ov.value),
          ),
        );
      const colourOk =
        !filters.colours?.length ||
        variants.some((v) =>
          v.option_values.some(
            (ov) => ov.option_name === "Colour" && filters.colours!.includes(ov.value),
          ),
        );
      if (!sizeOk || !colourOk) return false;
    }

    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      results = results.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      break;
    case "price-desc":
      results = results.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      break;
    case "best-selling":
      results = results.sort((a, b) => b.units_sold - a.units_sold);
      break;
    case "rating":
      results = results.sort(
        (a, b) =>
          (ratings.get(b.id)?.average ?? 0) - (ratings.get(a.id)?.average ?? 0),
      );
      break;
    default:
      results = results.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
  }

  const total = results.length;
  const perPage = filters.perPage ?? 12;
  const page = Math.max(1, filters.page ?? 1);

  return {
    products: results.slice(0, page * perPage),
    total,
    priceBounds,
  };
}

export async function listProducts(
  filters: ProductFilters,
): Promise<ProductListResult> {
  if (isDemoMode()) return listDemoProducts(filters);

  const supabase = createClient();
  const perPage = filters.perPage ?? 12;
  const page = Math.max(1, filters.page ?? 1);

  // Price bounds span the whole active catalogue so the slider range is stable.
  const { data: boundsRows } = await supabase
    .from("products")
    .select("price")
    .eq("status", "active")
    .order("price", { ascending: true });

  const prices =
    (boundsRows as { price: number }[] | null)?.map((r) => Number(r.price)) ?? [];
  const priceBounds = {
    min: prices.length ? Math.floor(prices[0]) : 0,
    max: prices.length ? Math.ceil(prices[prices.length - 1]) : 100000,
  };

  let variantProductIds: string[] | null = null;
  const optionFilters = [...(filters.sizes ?? []), ...(filters.colours ?? [])];

  if (optionFilters.length > 0) {
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("product_id, option_values, stock_quantity");

    const matched = new Set<string>();
    for (const row of (variantRows as {
      product_id: string;
      option_values: { option_name: string; value: string }[];
      stock_quantity: number;
    }[]) ?? []) {
      const values = (row.option_values ?? []).map((v) => v.value);
      const sizeOk =
        !filters.sizes?.length || filters.sizes.some((s) => values.includes(s));
      const colourOk =
        !filters.colours?.length || filters.colours.some((c) => values.includes(c));
      if (sizeOk && colourOk) matched.add(row.product_id);
    }
    variantProductIds = [...matched];
    if (variantProductIds.length === 0) {
      return { products: [], total: 0, priceBounds };
    }
  }

  let ratingProductIds: string[] | null = null;
  if (filters.minRating && filters.minRating > 0) {
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("product_id, rating");
    const totals = new Map<string, { sum: number; count: number }>();
    for (const row of (reviewRows as { product_id: string; rating: number }[]) ?? []) {
      const entry = totals.get(row.product_id) ?? { sum: 0, count: 0 };
      entry.sum += row.rating;
      entry.count += 1;
      totals.set(row.product_id, entry);
    }
    ratingProductIds = [...totals.entries()]
      .filter(([, v]) => v.sum / v.count >= filters.minRating!)
      .map(([id]) => id);
    if (ratingProductIds.length === 0) {
      return { products: [], total: 0, priceBounds };
    }
  }

  let query = supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT, { count: "exact" })
    .eq("status", "active");

  if (filters.gender) {
    query = query.in("gender", [filters.gender, "unisex"]);
  }

  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (cat) query = query.eq("category_id", (cat as { id: string }).id);
    else return { products: [], total: 0, priceBounds };
  }

  if (filters.search) {
    const term = filters.search.replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,short_description.ilike.%${term}%,description.ilike.%${term}%`,
      );
    }
  }

  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.inStock) query = query.gt("stock_quantity", 0);

  const idFilters = [variantProductIds, ratingProductIds].filter(
    (x): x is string[] => x !== null,
  );
  if (idFilters.length > 0) {
    const intersection = idFilters.reduce((acc, ids) =>
      acc.filter((id) => ids.includes(id)),
    );
    if (intersection.length === 0) return { products: [], total: 0, priceBounds };
    query = query.in("id", intersection);
  }

  switch (filters.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "best-selling":
      query = query.order("units_sold", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.range(0, page * perPage - 1);

  const { data, count } = await query;
  const rows = (data as unknown as ProductWithRelations[]) ?? [];

  // Supabase connected but the catalogue is empty (dev only) — show the demo
  // catalogue rather than an unexplained empty shop.
  if (shouldFallBackToDemo(rows.length) && !hasActiveFilters(filters)) {
    return listDemoProducts(filters);
  }

  return { products: rows, total: count ?? 0, priceBounds };
}

/** True when the shopper has narrowed the results themselves. */
function hasActiveFilters(filters: ProductFilters): boolean {
  return Boolean(
    filters.category ||
      filters.search ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.sizes?.length ||
      filters.colours?.length ||
      filters.minRating ||
      filters.inStock,
  );
}

export async function getFilterOptions(gender?: Gender): Promise<{
  sizes: string[];
  colours: string[];
}> {
  const sizes = new Set<string>();
  const colours = new Set<string>();

  if (isDemoMode()) {
    for (const product of demoProducts) {
      if (!matchesGender(product.gender, gender)) continue;
      for (const variant of product.product_variants ?? []) {
        for (const ov of variant.option_values) {
          if (ov.option_name === "Size") sizes.add(ov.value);
          else if (ov.option_name === "Colour") colours.add(ov.value);
        }
      }
    }
  } else {
    const supabase = createClient();
    const { data } = await supabase.from("product_variants").select("option_values");

    for (const row of (data as {
      option_values: { option_name: string; value: string }[];
    }[]) ?? []) {
      for (const ov of row.option_values ?? []) {
        const name = ov.option_name?.toLowerCase();
        if (name === "size") sizes.add(ov.value);
        else if (name === "colour" || name === "color") colours.add(ov.value);
      }
    }
  }

  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
  return {
    sizes: [...sizes].sort((a, b) => {
      const ai = sizeOrder.indexOf(a);
      const bi = sizeOrder.indexOf(b);
      // Numeric shoe sizes sort numerically; lettered sizes by the scale above.
      if (ai === -1 && bi === -1) return Number(a) - Number(b) || a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }),
    colours: [...colours].sort(),
  };
}

export async function searchProducts(term: string, limit = 8): Promise<Product[]> {
  if (!term.trim()) return [];

  if (isDemoMode()) {
    return listDemoProducts({ search: term.trim(), perPage: limit }).products;
  }

  const supabase = createClient();
  const safe = term.replace(/[%,()]/g, " ").trim();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_CARD_SELECT)
    .eq("status", "active")
    .or(`title.ilike.%${safe}%,short_description.ilike.%${safe}%`)
    .limit(limit);
  return (data as unknown as Product[]) ?? [];
}
