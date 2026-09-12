import { CUSTOMERS, ORDERS, REVIEWS } from './mockData'
import type { Customer, Order, Review } from '../types'

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  let result = [...CUSTOMERS]
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    )
  }
  return delay(result)
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return delay(CUSTOMERS.find((c) => c.id === id))
}

export async function getCustomerOrders(id: string): Promise<Order[]> {
  return delay(ORDERS.filter((o) => o.customerId === id))
}

export async function getCustomerReviews(id: string): Promise<Review[]> {
  return delay(REVIEWS.filter((r) => r.customerId === id))
}
