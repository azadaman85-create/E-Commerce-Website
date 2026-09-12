import { CUSTOMERS, ORDERS, PRODUCTS } from './mockData'
import type { Order, OrderStatus } from '../types'

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export interface KpiSummary {
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  revenueTotal: number
  ordersByStatus: Record<OrderStatus, number>
  productsInStock: number
  productsLowStock: number
  productsOutOfStock: number
  totalCustomers: number
  newCustomersThisMonth: number
}

export async function getKpiSummary(): Promise<KpiSummary> {
  const revenueTotal = ORDERS.filter((o) => o.paymentStatus === 'paid').reduce(
    (sum, o) => sum + o.total,
    0,
  )

  const ordersByStatus = ORDERS.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    },
    {} as Record<OrderStatus, number>,
  )

  let inStock = 0
  let lowStock = 0
  let outOfStock = 0
  for (const product of PRODUCTS) {
    for (const variant of product.variants) {
      const available = variant.stock - variant.reserved
      if (available <= 0) outOfStock++
      else if (available <= variant.threshold) lowStock++
      else inStock++
    }
  }

  return delay({
    revenueToday: Math.round(revenueTotal * 0.04),
    revenueWeek: Math.round(revenueTotal * 0.22),
    revenueMonth: Math.round(revenueTotal * 0.68),
    revenueTotal,
    ordersByStatus,
    productsInStock: inStock,
    productsLowStock: lowStock,
    productsOutOfStock: outOfStock,
    totalCustomers: CUSTOMERS.length,
    newCustomersThisMonth: CUSTOMERS.filter((c) => c.joinedAt.startsWith('2026-09')).length,
  })
}

export type SalesRange = 'today' | '7d' | '30d' | '12mo'

export interface SalesPoint {
  label: string
  revenue: number
}

export async function getSalesSeries(range: SalesRange): Promise<SalesPoint[]> {
  const baseline = ORDERS.filter((o) => o.paymentStatus === 'paid').length * 900

  const points: SalesPoint[] =
    range === 'today'
      ? ['9am', '11am', '1pm', '3pm', '5pm', '7pm', '9pm'].map((label, i) => ({
          label,
          revenue: Math.round(baseline * (0.05 + 0.03 * Math.sin(i))),
        }))
      : range === '7d'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({
            label,
            revenue: Math.round(baseline * (0.5 + 0.15 * Math.sin(i + 1))),
          }))
        : range === '30d'
          ? Array.from({ length: 10 }).map((_, i) => ({
              label: `Day ${i * 3 + 1}`,
              revenue: Math.round(baseline * (1.2 + 0.4 * Math.sin(i * 0.7))),
            }))
          : [
              'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
            ].map((label, i) => ({
              label,
              revenue: Math.round(baseline * (2.5 + 1.2 * Math.sin(i * 0.5))),
            }))

  return delay(points)
}

export interface OrderStatusSlice {
  status: OrderStatus
  count: number
}

export async function getOrderStatusBreakdown(): Promise<OrderStatusSlice[]> {
  const counts = ORDERS.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    },
    {} as Record<OrderStatus, number>,
  )

  return delay(
    (Object.entries(counts) as [OrderStatus, number][]).map(([status, count]) => ({
      status,
      count,
    })),
  )
}

export interface TopProduct {
  productId: string
  name: string
  image: string
  unitsSold: number
  revenue: number
}

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const salesByProduct = new Map<string, { unitsSold: number; revenue: number }>()

  for (const order of ORDERS) {
    for (const item of order.items) {
      const entry = salesByProduct.get(item.productId) ?? { unitsSold: 0, revenue: 0 }
      entry.unitsSold += item.qty
      entry.revenue += item.qty * item.price
      salesByProduct.set(item.productId, entry)
    }
  }

  const ranked = [...salesByProduct.entries()]
    .map(([productId, stats]) => {
      const product = PRODUCTS.find((p) => p.id === productId)
      return {
        productId,
        name: product?.name ?? 'Unknown product',
        image: product?.images[0] ?? '',
        ...stats,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return delay(ranked)
}

export async function getRecentOrders(limit = 6): Promise<Order[]> {
  return delay([...ORDERS].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit))
}

export interface DashboardAlert {
  id: string
  tone: 'warning' | 'info' | 'danger'
  message: string
}

export async function getAlerts(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = []

  const outOfStockCount = PRODUCTS.flatMap((p) => p.variants).filter(
    (v) => v.stock - v.reserved <= 0,
  ).length
  if (outOfStockCount > 0) {
    alerts.push({
      id: 'alert-oos',
      tone: 'danger',
      message: `${outOfStockCount} variant${outOfStockCount === 1 ? '' : 's'} out of stock`,
    })
  }

  const pendingOrders = ORDERS.filter((o) => o.status === 'new').length
  if (pendingOrders > 0) {
    alerts.push({
      id: 'alert-pending',
      tone: 'info',
      message: `${pendingOrders} new order${pendingOrders === 1 ? '' : 's'} awaiting confirmation`,
    })
  }

  alerts.push({ id: 'alert-reviews', tone: 'warning', message: '3 reviews pending moderation' })

  return delay(alerts)
}
