import { CATEGORIES, CUSTOMERS, ORDERS, PRODUCTS } from './mockData'

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export type ReportType = 'sales' | 'revenue' | 'orders' | 'inventory' | 'customer' | 'returns'

export interface ReportRow {
  label: string
  value: string
  meta?: string
}

export async function getReport(type: ReportType): Promise<ReportRow[]> {
  switch (type) {
    case 'sales':
      return delay(
        CATEGORIES.map((cat) => {
          const catProducts = PRODUCTS.filter((p) => p.categoryId === cat.id).map((p) => p.id)
          const units = ORDERS.flatMap((o) => o.items).filter((i) =>
            catProducts.includes(i.productId),
          ).reduce((sum, i) => sum + i.qty, 0)
          return { label: cat.name, value: `${units} units sold`, meta: cat.slug }
        }),
      )
    case 'revenue':
      return delay(
        ORDERS.slice(0, 8).map((o) => ({
          label: o.orderNumber,
          value: `₹${o.total.toLocaleString('en-IN')}`,
          meta: o.createdAt,
        })),
      )
    case 'orders':
      return delay(
        (['new', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled', 'returned'] as const).map(
          (status) => ({
            label: status,
            value: `${ORDERS.filter((o) => o.status === status).length} orders`,
          }),
        ),
      )
    case 'inventory':
      return delay(
        PRODUCTS.map((p) => ({
          label: p.name,
          value: `${p.variants.reduce((sum, v) => sum + v.stock, 0)} units in stock`,
          meta: p.sku,
        })),
      )
    case 'customer':
      return delay(
        [...CUSTOMERS]
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 8)
          .map((c) => ({
            label: c.name,
            value: `₹${c.totalSpent.toLocaleString('en-IN')}`,
            meta: `${c.totalOrders} orders`,
          })),
      )
    case 'returns':
      return delay(
        ORDERS.filter((o) => o.status === 'returned' || o.status === 'refunded').map((o) => ({
          label: o.orderNumber,
          value: o.status,
          meta: `₹${o.total.toLocaleString('en-IN')}`,
        })),
      )
  }
}
