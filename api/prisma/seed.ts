/**
 * Seeds the database from the storefront's generated catalogue, so the shop
 * looks identical the moment it starts reading from the API instead of from
 * lib/catalog.ts. After this runs, the database is the source of truth and
 * that file becomes a fetch client.
 */
import { PrismaClient } from '@prisma/client'
import { collections, products } from '../../Frontend_Dashboard/mi-trends/lib/catalog.js'

const prisma = new PrismaClient()

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Deterministic so reseeding gives the same numbers rather than churn. */
function stockFor(productId: number, sizeIndex: number, colorIndex: number) {
  return ((productId * 7 + sizeIndex * 3 + colorIndex * 5) % 18) + 3
}

async function main() {
  console.log('Clearing existing data...')
  await prisma.inventoryLog.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.category.deleteMany()
  await prisma.brand.deleteMany()

  const brand = await prisma.brand.create({ data: { name: 'MI TRENDS', slug: 'mi-trends' } })

  console.log(`Seeding ${collections.length} collections...`)
  const collectionIds = new Map<string, string>()
  for (const collection of collections) {
    const row = await prisma.collection.create({
      data: {
        name: collection.name,
        slug: collection.slug,
        tagline: collection.tagline,
        description: collection.description,
        motif: collection.motif,
        palette: JSON.stringify(collection.palette),
      },
    })
    collectionIds.set(collection.slug, row.id)
  }

  // The product master's categories are garment types — the men/women/unisex
  // split lives on the product as `audience`, which is what the storefront
  // filters on.
  const types = [...new Set(products.map((product) => product.type))].sort()
  console.log(`Seeding ${types.length} categories...`)
  const categoryIds = new Map<string, string>()
  for (const type of types) {
    const row = await prisma.category.create({ data: { name: type, slug: slugify(type) } })
    categoryIds.set(type, row.id)
  }

  console.log(`Seeding ${products.length} products...`)
  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        type: product.type,
        audience: product.category,
        description: `${product.art}. ${product.fit}, cut in ${product.fabric.toLowerCase()}.`,
        mrp: product.mrp,
        price: product.price,
        discount: product.discount,
        fit: product.fit,
        fabric: product.fabric,
        care: 'Machine wash cold, tumble dry low, do not bleach.',
        sizeGuide: 'See the size guide for garment measurements in inches.',
        art: product.art,
        palette: JSON.stringify(product.palette),
        colors: JSON.stringify(product.colors),
        tags: JSON.stringify(product.tags),
        imageUrl: product.imageUrl ?? null,
        backImageUrl: product.backImageUrl ?? null,
        status: 'active',
        rating: product.rating,
        reviewCount: product.reviewCount,
        popularity: product.popularity,
        categoryId: categoryIds.get(product.type) ?? null,
        brandId: brand.id,
        collectionId: collectionIds.get(product.collectionSlug) ?? null,
        variants: {
          create: product.sizes.flatMap((size, sizeIndex) =>
            product.colors.map((color, colorIndex) => ({
              size,
              color: color.name,
              sku: `${product.sku}-${slugify(size)}-${slugify(color.name)}`,
              // Preserve exactly which sizes the storefront showed as sold out.
              stock: product.outOfStock.includes(size) ? 0 : stockFor(product.id, sizeIndex, colorIndex),
              threshold: 5,
            })),
          ),
        },
      },
    })
  }

  const [productCount, variantCount] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
  ])
  console.log(`Done. ${productCount} products, ${variantCount} variants.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
