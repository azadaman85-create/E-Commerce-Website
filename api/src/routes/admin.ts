import { Router } from 'express'
import { prisma } from '../db.js'
import { productInclude, toAdminProduct } from '../mappers.js'

export const adminRouter = Router()

/* ---------------------------------- masters --------------------------------- */

adminRouter.get('/categories', async (_req, res) => {
  const rows = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  res.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentId: row.parentId ?? undefined,
      productCount: row._count.products,
    })),
  )
})

adminRouter.post('/categories', async (req, res) => {
  const { name, slug, parentId } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'name is required' })
  const row = await prisma.category.create({
    data: { name, slug: slug || slugify(name), parentId: parentId || null },
  })
  res.status(201).json({ ...row, parentId: row.parentId ?? undefined, productCount: 0 })
})

adminRouter.delete('/categories/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

adminRouter.get('/brands', async (_req, res) => {
  const rows = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  res.json(rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, productCount: row._count.products })))
})

adminRouter.post('/brands', async (req, res) => {
  const { name, slug } = req.body ?? {}
  if (!name) return res.status(400).json({ error: 'name is required' })
  const row = await prisma.brand.create({ data: { name, slug: slug || slugify(name) } })
  res.status(201).json({ ...row, productCount: 0 })
})

adminRouter.delete('/brands/:id', async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

adminRouter.get('/collections', async (_req, res) => {
  const rows = await prisma.collection.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  res.json(rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, productCount: row._count.products })))
})

/* --------------------------------- products --------------------------------- */

/** Every status, unlike the public route. */
adminRouter.get('/products', async (_req, res) => {
  const rows = await prisma.product.findMany({ include: productInclude, orderBy: { id: 'asc' } })
  res.json(rows.map(toAdminProduct))
})

adminRouter.get('/products/:id', async (req, res) => {
  const row = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: productInclude,
  })
  if (!row) return res.status(404).json({ error: 'Product not found' })
  res.json(toAdminProduct(row))
})

adminRouter.post('/products', async (req, res) => {
  const body = req.body ?? {}
  if (!body.name) return res.status(400).json({ error: 'name is required' })

  const brand = body.brand ? await ensureBrand(body.brand) : null
  const slug = body.slug || slugify(body.name)
  const mrp = Number(body.price) || 0
  const sale = body.salePrice != null ? Number(body.salePrice) : null

  const row = await prisma.product.create({
    data: {
      slug: await uniqueSlug(slug),
      name: body.name,
      sku: body.sku || `MIT-${slug.slice(0, 12).toUpperCase()}`,
      type: body.type || 'Graphic T-shirt',
      audience: body.audience || 'unisex',
      description: body.description ?? '',
      mrp,
      price: sale ?? mrp,
      discount: sale && mrp > 0 ? Math.round(((mrp - sale) / mrp) * 100) : 0,
      fit: body.fit ?? '',
      fabric: body.fabric ?? '',
      care: body.care ?? '',
      sizeGuide: body.sizeGuide ?? '',
      art: body.art ?? '',
      palette: JSON.stringify(body.palette ?? ['#171717', '#e5482b', '#f5f3ef']),
      colors: JSON.stringify(body.colors ?? [{ name: 'Ink Black', hex: '#171717' }]),
      tags: JSON.stringify(body.tags ?? []),
      imageUrl: body.images?.[0] ?? body.imageUrl ?? null,
      backImageUrl: body.images?.[1] ?? body.backImageUrl ?? null,
      status: body.status ?? 'draft',
      categoryId: body.categoryId || null,
      brandId: brand?.id ?? null,
      collectionId: body.collectionIds?.[0] || body.collectionId || null,
      variants: {
        create: (body.variants ?? []).map((variant: Record<string, unknown>) => ({
          size: String(variant.size ?? 'M'),
          color: String(variant.color ?? 'Ink Black'),
          sku: String(variant.sku ?? `${slug}-${variant.size}`),
          stock: Number(variant.stock ?? 0),
          reserved: Number(variant.reserved ?? 0),
          threshold: Number(variant.threshold ?? 5),
        })),
      },
    },
    include: productInclude,
  })

  res.status(201).json(toAdminProduct(row))
})

adminRouter.put('/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  const body = req.body ?? {}
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Product not found' })

  const brand = body.brand ? await ensureBrand(body.brand) : null
  const mrp = body.price != null ? Number(body.price) : existing.mrp
  const sale = body.salePrice != null ? Number(body.salePrice) : null

  const row = await prisma.product.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      sku: body.sku ?? existing.sku,
      description: body.description ?? existing.description,
      mrp,
      price: sale ?? mrp,
      discount: sale && mrp > 0 ? Math.round(((mrp - sale) / mrp) * 100) : 0,
      fit: body.fit ?? existing.fit,
      fabric: body.fabric ?? existing.fabric,
      care: body.care ?? existing.care,
      sizeGuide: body.sizeGuide ?? existing.sizeGuide,
      status: body.status ?? existing.status,
      categoryId: body.categoryId ?? existing.categoryId,
      brandId: brand?.id ?? existing.brandId,
      collectionId: body.collectionIds?.[0] ?? existing.collectionId,
      tags: body.tags ? JSON.stringify(body.tags) : existing.tags,
      imageUrl: body.images?.[0] ?? existing.imageUrl,
      backImageUrl: body.images?.[1] ?? existing.backImageUrl,
    },
    include: productInclude,
  })

  res.json(toAdminProduct(row))
})

adminRouter.patch('/products/:id/status', async (req, res) => {
  const row = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: { status: req.body?.status ?? 'draft' },
    include: productInclude,
  })
  res.json(toAdminProduct(row))
})

adminRouter.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } })
  res.status(204).end()
})

/* -------------------------------- inventory --------------------------------- */

adminRouter.get('/inventory/logs', async (_req, res) => {
  const rows = await prisma.inventoryLog.findMany({ orderBy: { date: 'desc' }, take: 200 })
  res.json(rows.map((row) => ({ ...row, date: row.date.toISOString().slice(0, 10) })))
})

/** Adjusts one variant's stock and records why, in a single transaction. */
adminRouter.patch('/inventory/:variantId', async (req, res) => {
  const { change, reason, adjustedBy, productName, variantLabel } = req.body ?? {}
  const variant = await prisma.productVariant.findUnique({
    where: { id: req.params.variantId },
    include: { product: true },
  })
  if (!variant) return res.status(404).json({ error: 'Variant not found' })

  const [updated, log] = await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: Math.max(0, variant.stock + Number(change ?? 0)) },
    }),
    prisma.inventoryLog.create({
      data: {
        variantId: variant.id,
        productName: productName ?? variant.product.name,
        variantLabel: variantLabel ?? `${variant.size} / ${variant.color}`,
        change: Number(change ?? 0),
        reason: reason ?? 'Manual adjustment',
        adjustedBy: adjustedBy ?? 'admin',
      },
    }),
  ])

  res.json({ variant: updated, log: { ...log, date: log.date.toISOString().slice(0, 10) } })
})

/* --------------------------------- helpers ---------------------------------- */

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string) {
  let slug = base
  let n = 2
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`
  }
  return slug
}

async function ensureBrand(name: string) {
  const slug = slugify(name)
  return prisma.brand.upsert({ where: { slug }, update: {}, create: { name, slug } })
}
