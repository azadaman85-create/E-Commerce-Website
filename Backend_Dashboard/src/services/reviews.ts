import { REVIEWS } from './mockData'
import type { Review } from '../types'

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const reviews = [...REVIEWS]

export async function listReviews(status?: Review['status']): Promise<Review[]> {
  const result = status ? reviews.filter((r) => r.status === status) : reviews
  return delay([...result].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
}

export async function setReviewStatus(id: string, status: Review['status']): Promise<Review> {
  const review = reviews.find((r) => r.id === id)
  if (!review) throw new Error('Review not found')
  review.status = status
  return delay(review)
}
