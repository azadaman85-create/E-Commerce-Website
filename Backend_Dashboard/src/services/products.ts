import { COLLECTIONS, INVENTORY_LOGS, PRODUCTS, TAGS } from './mockData'
import { listCategories } from './categories'
import type { InventoryLog, Product, ProductStatus } from '../types'

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const products = [...PRODUCTS]
const inventoryLogs = [...INVENTORY_LOGS]

export interface ProductFilters {
  search?: string
  categoryId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
}

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let result = [...products]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }
  if (filters.categoryId) {
    result = result.filter((p) => p.categoryId === filters.categoryId)
  }
  if (filters.status) {
    result = result.filter((p) => p.status === filters.status)
  }
  if (filters.minPrice != null) {
    result = result.filter((p) => (p.salePrice ?? p.price) >= filters.minPrice!)
  }
  if (filters.maxPrice != null) {
    result = result.filter((p) => (p.salePrice ?? p.price) <= filters.maxPrice!)
  }

  return delay(result)
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return delay(products.find((p) => p.id === id))
}

export async function getCategories() {
  return listCategories()
}

export async function getCollections() {
  return delay(COLLECTIONS)
}

export async function getTags() {
  return delay(TAGS)
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<Product> {
  const product = products.find((p) => p.id === id)
  if (!product) throw new Error('Product not found')
  product.status = status
  return delay(product)
}

export async function duplicateProduct(id: string): Promise<Product> {
  const source = products.find((p) => p.id === id)
  if (!source) throw new Error('Product not found')
  const copy: Product = {
    ...source,
    id: `${source.id}-copy-${Date.now()}`,
    name: `${source.name} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString().slice(0, 10),
  }
  products.unshift(copy)
  return delay(copy)
}

export async function deleteProduct(id: string): Promise<void> {
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) products.splice(index, 1)
  return delay(undefined)
}

export async function saveProduct(product: Product): Promise<Product> {
  const index = products.findIndex((p) => p.id === product.id)
  if (index === -1) {
    products.unshift(product)
  } else {
    products[index] = product
  }
  return delay(product)
}

export async function getInventoryLogs(): Promise<InventoryLog[]> {
  return delay([...inventoryLogs].sort((a, b) => (a.date < b.date ? 1 : -1)))
}

export async function adjustStock(
  variantId: string,
  productName: string,
  variantLabel: string,
  change: number,
  reason: string,
  adjustedBy: string,
): Promise<InventoryLog> {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId)
    if (variant) {
      variant.stock = Math.max(0, variant.stock + change)
      break
    }
  }

  const log: InventoryLog = {
    id: `log-${Date.now()}`,
    variantId,
    productName,
    variantLabel,
    change,
    reason,
    adjustedBy,
    date: new Date().toISOString().slice(0, 10),
  }
  inventoryLogs.unshift(log)
  return delay(log)
}
