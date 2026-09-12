import { COUPONS, PROMOTIONS } from './mockData'
import type { Coupon, Promotion } from '../types'

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const coupons = [...COUPONS]
const promotions = [...PROMOTIONS]

export async function listCoupons(): Promise<Coupon[]> {
  return delay([...coupons])
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'usedCount'>): Promise<Coupon> {
  const created: Coupon = { ...coupon, id: `coup-${Date.now()}`, usedCount: 0 }
  coupons.unshift(created)
  return delay(created)
}

export async function deleteCoupon(id: string): Promise<void> {
  const index = coupons.findIndex((c) => c.id === id)
  if (index !== -1) coupons.splice(index, 1)
  return delay(undefined)
}

export async function listPromotions(): Promise<Promotion[]> {
  return delay([...promotions])
}

export async function createPromotion(
  promotion: Omit<Promotion, 'id'>,
): Promise<Promotion> {
  const created: Promotion = { ...promotion, id: `promo-${Date.now()}` }
  promotions.unshift(created)
  return delay(created)
}

export async function deletePromotion(id: string): Promise<void> {
  const index = promotions.findIndex((p) => p.id === id)
  if (index !== -1) promotions.splice(index, 1)
  return delay(undefined)
}
