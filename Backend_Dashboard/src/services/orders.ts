import { ORDERS } from './mockData'
import type { Order, OrderStatus } from '../types'

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const orders = [...ORDERS]

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'new',
  'confirmed',
  'packing',
  'ready',
  'shipped',
  'out_for_delivery',
  'delivered',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  packing: 'Packing',
  ready: 'Ready',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
}

export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const result = status ? orders.filter((o) => o.status === status) : orders
  return delay([...result].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return delay(orders.find((o) => o.id === id))
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const order = orders.find((o) => o.id === id)
  if (!order) throw new Error('Order not found')
  order.status = status
  return delay(order)
}
