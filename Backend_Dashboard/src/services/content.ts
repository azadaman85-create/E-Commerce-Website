import { PAGE_CONTENT, PRODUCTS } from './mockData'
import type { PageContent } from '../types'

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

let content: PageContent = { ...PAGE_CONTENT }

export async function getPageContent(): Promise<PageContent> {
  return delay(content)
}

export async function updatePageContent(update: Partial<PageContent>): Promise<PageContent> {
  content = { ...content, ...update }
  return delay(content)
}

export async function getFeaturedProducts() {
  return delay(PRODUCTS.filter((p) => content.featuredProductIds.includes(p.id)))
}
