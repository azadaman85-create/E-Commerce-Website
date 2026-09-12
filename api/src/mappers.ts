import type { Prisma } from '@prisma/client'

export const productInclude = {
  collection: true,
  category: true,
  brand: true,
  variants: true,
} satisfies Prisma.ProductInclude

export type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>

function json<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Sizes in the order the storefront expects, deduplicated across colours. */
function sizesOf(row: ProductRow) {
  const seen: string[] = []
  for (const variant of row.variants) {
    if (!seen.includes(variant.size)) seen.push(variant.size)
  }
  return seen
}

/**
 * Shapes a row into the storefront's `Product` type (lib/types.ts) exactly.
 * A size counts as out of stock only when every colour in it is at zero.
 */
export function toStorefrontProduct(row: ProductRow) {
  const sizes = sizesOf(row)
  const outOfStock = sizes.filter((size) =>
    row.variants
      .filter((variant) => variant.size === size)
      .every((variant) => variant.stock <= 0),
  )

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    collection: row.collection?.name ?? '',
    collectionSlug: row.collection?.slug ?? '',
    type: row.type,
    category: row.audience as 'men' | 'women' | 'unisex',
    colors: json<{ name: string; hex: string }[]>(row.colors, []),
    sizes,
    outOfStock,
    mrp: row.mrp,
    price: row.price,
    discount: row.discount,
    rating: row.rating,
    reviewCount: row.reviewCount,
    tags: json<string[]>(row.tags, []),
    popularity: row.popularity,
    fit: row.fit,
    fabric: row.fabric,
    sku: row.sku,
    art: row.art,
    palette: json<[string, string, string]>(row.palette, ['#111827', '#ff4d5a', '#c7ff4a']),
    imageUrl: row.imageUrl ?? undefined,
    backImageUrl: row.backImageUrl ?? undefined,
  }
}

/**
 * Shapes a row into the admin panel's `Product` type (src/types/index.ts).
 * The admin models a discount as price + salePrice rather than a percentage.
 */
export function toAdminProduct(row: ProductRow) {
  return {
    id: String(row.id),
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    categoryId: row.categoryId ?? '',
    collectionIds: row.collectionId ? [row.collectionId] : [],
    brand: row.brand?.name ?? '',
    price: row.mrp,
    salePrice: row.discount > 0 ? row.price : undefined,
    description: row.description,
    fabric: row.fabric,
    care: row.care,
    fit: row.fit,
    sizeGuide: row.sizeGuide,
    images: [row.imageUrl, row.backImageUrl].filter((url): url is string => Boolean(url)),
    status: row.status as 'active' | 'draft' | 'archived',
    rating: row.rating,
    reviewCount: row.reviewCount,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    tags: json<string[]>(row.tags, []),
    variants: row.variants.map((variant) => ({
      id: variant.id,
      productId: String(row.id),
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
      reserved: variant.reserved,
      threshold: variant.threshold,
    })),
  }
}
