import { api } from './http'
import { TAGS } from './mockData'
import { listCategories } from './categories'
import type { InventoryLog, Product, ProductStatus } from '../types'

export interface ProductFilters {
  search?: string
  categoryId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
}

/**
 * Filtering stays client-side: the catalogue is small enough that one request
 * plus an in-memory filter beats a round trip per keystroke.
 */
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let result = await api<Product[]>('/api/admin/products')

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

  return result
}

export async function getProduct(id: string): Promise<Product | undefined> {
  try {
    return await api<Product>(`/api/admin/products/${id}`)
  } catch {
    return undefined
  }
}

export async function getCategories() {
  return listCategories()
}

export async function getCollections() {
  return api<{ id: string; name: string; slug: string; productCount: number }[]>(
    '/api/admin/collections',
  )
}

// Tags are still a fixed vocabulary rather than a managed table.
export async function getTags() {
  return Promise.resolve(TAGS)
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<Product> {
  return api<Product>(`/api/admin/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function duplicateProduct(id: string): Promise<Product> {
  const source = await api<Product>(`/api/admin/products/${id}`)
  return api<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify({ ...source, id: undefined, name: `${source.name} (Copy)`, status: 'draft' }),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await api<void>(`/api/admin/products/${id}`, { method: 'DELETE' })
}

/** An id that is not yet on the server means this is a create, not an update. */
export async function saveProduct(product: Product): Promise<Product> {
  const existing = product.id ? await getProduct(product.id) : undefined

  if (!existing) {
    return api<Product>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }

  return api<Product>(`/api/admin/products/${product.id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export async function getInventoryLogs(): Promise<InventoryLog[]> {
  return api<InventoryLog[]>('/api/admin/inventory/logs')
}

export async function adjustStock(
  variantId: string,
  productName: string,
  variantLabel: string,
  change: number,
  reason: string,
  adjustedBy: string,
): Promise<InventoryLog> {
  const result = await api<{ log: InventoryLog }>(`/api/admin/inventory/${variantId}`, {
    method: 'PATCH',
    body: JSON.stringify({ change, reason, adjustedBy, productName, variantLabel }),
  })
  return result.log
}
