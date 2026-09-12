import { Router } from 'express'
import { prisma } from '../db.js'
import { productInclude, toStorefrontProduct } from '../mappers.js'

export const shopRouter = Router()

/** Public catalogue. Drafts and archived products never reach the storefront. */
shopRouter.get('/products', async (_req, res) => {
  const rows = await prisma.product.findMany({
    where: { status: 'active' },
    include: productInclude,
    orderBy: { id: 'asc' },
  })
  res.json(rows.map(toStorefrontProduct))
})

shopRouter.get('/products/:slug', async (req, res) => {
  const row = await prisma.product.findFirst({
    where: { slug: req.params.slug, status: 'active' },
    include: productInclude,
  })
  if (!row) return res.status(404).json({ error: 'Product not found' })
  res.json(toStorefrontProduct(row))
})

shopRouter.get('/collections', async (_req, res) => {
  const rows = await prisma.collection.findMany({ orderBy: { name: 'asc' } })
  res.json(
    rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      tagline: row.tagline,
      description: row.description,
      motif: row.motif,
      palette: JSON.parse(row.palette || '[]'),
    })),
  )
})
