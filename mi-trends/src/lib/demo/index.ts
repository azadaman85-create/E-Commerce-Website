import type {
  Category,
  HeroSlide,
  ProductOption,
  ProductVariant,
  ProductWithRelations,
  Review,
  ShippingMethod,
  SiteSettings,
  SocialPost,
  Testimonial,
  VariantOptionValue,
} from "@/types";
import {
  DEMO_CATEGORIES,
  DEMO_HERO_SLIDES,
  DEMO_PRODUCTS,
  DEMO_REVIEW_SNIPPETS,
  DEMO_SOCIAL_POSTS,
  DEMO_TESTIMONIALS,
  type DemoProductSpec,
} from "@/lib/demo/catalogue";

/**
 * Demo mode is on when Supabase has not been configured — either the env var
 * is missing entirely, or it is still the `.env.example` placeholder. In that
 * state every storefront query is served from the in-memory catalogue so the
 * site is fully browsable on localhost without a database.
 */
export function isDemoMode(): boolean {
  // Explicit override — set NEXT_PUBLIC_DEMO_MODE=1 to browse the demo
  // catalogue even when Supabase credentials are present.
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "1") return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return true;
  return url.includes("your-project") || url.includes("your-supabase");
}

/**
 * In development only, fall back to the demo catalogue when Supabase is
 * configured but has no products in it yet — i.e. the migrations have run but
 * the seed has not. This keeps localhost browsable during setup instead of
 * showing an empty shop with no explanation.
 *
 * Never applies in production: an empty catalogue there is a real problem and
 * should look like one rather than being papered over with sample data.
 */
export function shouldFallBackToDemo(rowCount: number): boolean {
  if (rowCount > 0) return false;
  if (process.env.NODE_ENV === "production") return false;

  if (!warnedAboutEmptyCatalogue) {
    warnedAboutEmptyCatalogue = true;
    console.warn(
      "\n[MI TRENDS] Supabase is connected but has no products.\n" +
        "           Showing the demo catalogue so localhost stays browsable.\n" +
        "           Run supabase/SETUP.sql in the Supabase SQL editor to load real data.\n",
    );
  }
  return true;
}

let warnedAboutEmptyCatalogue = false;

/** Stable pseudo-random in [0, 1) so demo data does not change between renders. */
function seeded(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

/**
 * Deterministic id that is a *valid* v4 UUID, not merely UUID-shaped.
 *
 * The version nibble is forced to 4 and the variant nibble to 8-b, because
 * these ids flow through `z.string().uuid()` on the API routes and into
 * Postgres `uuid` columns, both of which reject a malformed one.
 */
function demoId(namespace: string, key: string): string {
  const base = `${namespace}-${key}`;
  let hex = "";
  let hash = 2166136261;
  for (let i = 0; i < 32; i++) {
    hash ^= base.charCodeAt(i % base.length) + i;
    hash = Math.imul(hash, 16777619);
    hex += ((hash >>> 28) & 0xf).toString(16);
  }

  const chars = hex.split("");
  chars[12] = "4";
  chars[16] = "89ab"[parseInt(chars[16], 16) % 4];
  const out = chars.join("");

  return [
    out.slice(0, 8),
    out.slice(8, 12),
    out.slice(12, 16),
    out.slice(16, 20),
    out.slice(20, 32),
  ].join("-");
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const demoCategories: Category[] = DEMO_CATEGORIES.map((category, index) => ({
  id: demoId("category", category.slug),
  name: category.name,
  slug: category.slug,
  description: null,
  image_url: category.image,
  parent_id: null,
  sort_order: index,
  created_at: daysAgo(200),
}));

const categoryBySlug = new Map(demoCategories.map((c) => [c.slug, c]));

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
function buildOptions(spec: DemoProductSpec, productId: string): ProductOption[] {
  const options: ProductOption[] = [];

  if (spec.sizes?.length) {
    const optionId = demoId("option", `${spec.slug}-size`);
    options.push({
      id: optionId,
      product_id: productId,
      name: "Size",
      sort_order: 0,
      product_option_values: spec.sizes.map((value, i) => ({
        id: demoId("value", `${spec.slug}-size-${value}`),
        option_id: optionId,
        value,
        sort_order: i,
      })),
    });
  }

  if (spec.colours?.length) {
    const optionId = demoId("option", `${spec.slug}-colour`);
    options.push({
      id: optionId,
      product_id: productId,
      name: "Colour",
      sort_order: options.length,
      product_option_values: spec.colours.map((value, i) => ({
        id: demoId("value", `${spec.slug}-colour-${value}`),
        option_id: optionId,
        value,
        sort_order: i,
      })),
    });
  }

  return options;
}

function buildVariants(
  spec: DemoProductSpec,
  productId: string,
  options: ProductOption[],
): ProductVariant[] {
  if (options.length === 0) return [];

  // Cartesian product of every option's values.
  const combinations = options.reduce<VariantOptionValue[][]>(
    (acc, option) =>
      acc.flatMap((combo) =>
        (option.product_option_values ?? []).map((value) => [
          ...combo,
          { option_name: option.name, value: value.value },
        ]),
      ),
    [[]],
  );

  return combinations.map((combination) => {
    const key = combination.map((c) => c.value).join("-");
    // Zero out roughly one combination in twelve so the PDP has a genuine
    // sold-out state to show.
    const soldOut = seeded(`${spec.slug}-${key}`) > 0.92;

    return {
      id: demoId("variant", `${spec.slug}-${key}`),
      product_id: productId,
      sku: `${spec.sku}-${combination.map((c) => c.value.slice(0, 3).toUpperCase()).join("-")}`,
      price: null,
      stock_quantity: soldOut ? 0 : 4 + Math.floor(seeded(`stock-${spec.slug}-${key}`) * 20),
      option_values: combination,
      created_at: daysAgo(spec.daysOld),
    };
  });
}

function buildProduct(spec: DemoProductSpec): ProductWithRelations {
  const id = demoId("product", spec.slug);
  const category = categoryBySlug.get(spec.category) ?? null;
  const options = buildOptions(spec, id);

  return {
    id,
    title: spec.title,
    slug: spec.slug,
    description: spec.description,
    short_description: spec.short,
    category_id: category?.id ?? null,
    gender: spec.gender,
    price: spec.price,
    sale_price: spec.salePrice ?? null,
    sale_start: null,
    sale_end: null,
    sku: spec.sku,
    stock_quantity: spec.stock,
    track_inventory: true,
    allow_backorders: false,
    status: "active",
    meta_title: null,
    meta_description: spec.short,
    og_image_url: spec.images[0],
    tags: spec.tags,
    units_sold: spec.unitsSold,
    created_at: daysAgo(spec.daysOld),
    updated_at: daysAgo(Math.max(0, spec.daysOld - 2)),
    categories: category,
    product_images: spec.images.map((url, i) => ({
      id: demoId("image", `${spec.slug}-${i}`),
      product_id: id,
      image_url: url,
      sort_order: i,
      alt_text: i === 0 ? spec.title : `${spec.title} — detail`,
    })),
    product_options: options,
    product_variants: buildVariants(spec, id, options),
  };
}

export const demoProducts: ProductWithRelations[] = DEMO_PRODUCTS.map(buildProduct);

const productBySlug = new Map(demoProducts.map((p) => [p.slug, p]));
const specBySlug = new Map(DEMO_PRODUCTS.map((s) => [s.slug, s]));

export function getDemoProductBySlug(slug: string): ProductWithRelations | null {
  return productBySlug.get(slug) ?? null;
}

export function getDemoProductById(id: string): ProductWithRelations | null {
  return demoProducts.find((p) => p.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Reviews — generated from each product's declared rating and review count
// ---------------------------------------------------------------------------
const REVIEW_AUTHORS = [
  "Ananya R.", "Devansh K.", "Priya M.", "Rohan S.", "Meera T.",
  "Arjun P.", "Kavya N.", "Ishaan G.", "Sneha V.", "Aditya B.",
];

export function getDemoReviews(productId: string): Review[] {
  const product = demoProducts.find((p) => p.id === productId);
  if (!product) return [];

  const spec = specBySlug.get(product.slug);
  if (!spec) return [];

  // Show at most 8 written reviews; the summary still reports the full count.
  const shown = Math.min(spec.reviewCount, 8);

  return Array.from({ length: shown }, (_, i) => {
    const snippet = DEMO_REVIEW_SNIPPETS[i % DEMO_REVIEW_SNIPPETS.length];
    const drift = seeded(`${product.slug}-review-${i}`);
    // Cluster ratings around the product's headline average.
    const rating = Math.max(3, Math.min(5, Math.round(spec.rating + (drift - 0.5))));

    return {
      id: demoId("review", `${product.slug}-${i}`),
      product_id: productId,
      user_id: null,
      rating,
      title: snippet.title,
      body: snippet.body,
      is_verified: drift > 0.25,
      author_name: REVIEW_AUTHORS[(i + product.slug.length) % REVIEW_AUTHORS.length],
      created_at: daysAgo(3 + i * 6),
    };
  });
}

export function getDemoRatings(): Map<string, { average: number; count: number }> {
  const map = new Map<string, { average: number; count: number }>();
  for (const spec of DEMO_PRODUCTS) {
    map.set(demoId("product", spec.slug), {
      average: spec.rating,
      count: spec.reviewCount,
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Settings and homepage content
// ---------------------------------------------------------------------------
export const demoSettings: SiteSettings = {
  id: demoId("settings", "site"),
  site_name: "MI TRENDS",
  tagline: "Considered essentials for men and women.",
  logo_url: null,
  logo_inverted_url: null,
  favicon_url: null,
  contact_email: "hello@mitrends.com",
  contact_phone: "+91 98765 43210",
  business_address: "4th Floor, Prestige Atrium, MG Road, Bengaluru 560001, India",
  currency_code: "INR",
  currency_symbol: "₹",
  tax_rate: 18,
  tax_inclusive: false,
  announcement_bar_active: true,
  announcement_bar_text: "Complimentary shipping on orders over ₹2,000 · Demo data",
  announcement_bar_link: null,
  announcement_bar_color: "#1A1A1A",
  social_instagram: "https://instagram.com",
  social_facebook: "https://facebook.com",
  social_twitter: "https://x.com",
  social_tiktok: null,
  social_youtube: "https://youtube.com",
  sale_active: true,
  sale_headline: "Mid-season sale — up to 30% off",
  sale_ends_at: (() => {
    const date = new Date();
    date.setDate(date.getDate() + 6);
    return date.toISOString();
  })(),
  updated_at: new Date().toISOString(),
};

export const demoHeroSlides: HeroSlide[] = DEMO_HERO_SLIDES.map((slide, i) => ({
  id: demoId("slide", String(i)),
  image_url: slide.image_url,
  heading: slide.heading,
  subheading: slide.subheading,
  cta_text: slide.cta_text,
  cta_link: slide.cta_link,
  sort_order: i,
  is_active: true,
}));

export const demoTestimonials: Testimonial[] = DEMO_TESTIMONIALS.map((t, i) => ({
  id: demoId("testimonial", String(i)),
  author_name: t.author_name,
  author_role: t.author_role,
  quote: t.quote,
  rating: t.rating,
  avatar_url: null,
  sort_order: i,
  is_active: true,
}));

export const demoSocialPosts: SocialPost[] = DEMO_SOCIAL_POSTS.map((url, i) => ({
  id: demoId("social", String(i)),
  image_url: url,
  link: "/products",
  caption: "From the feed",
  sort_order: i,
  is_active: true,
}));

export const demoShippingMethods: ShippingMethod[] = [
  {
    id: demoId("shipping", "standard"),
    name: "Standard",
    price: 99,
    estimated_delivery: "4–6 business days",
    free_shipping_threshold: 2000,
    sort_order: 0,
    is_active: true,
  },
  {
    id: demoId("shipping", "express"),
    name: "Express",
    price: 249,
    estimated_delivery: "2–3 business days",
    free_shipping_threshold: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: demoId("shipping", "nextday"),
    name: "Next Day",
    price: 499,
    estimated_delivery: "Next business day",
    free_shipping_threshold: null,
    sort_order: 2,
    is_active: true,
  },
];

export function getDemoShippingMethod(id: string): ShippingMethod | null {
  return demoShippingMethods.find((m) => m.id === id) ?? null;
}
