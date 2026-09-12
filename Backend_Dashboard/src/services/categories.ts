import { CATEGORIES } from './mockData'
import type { Category } from '../types'

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const categories = [...CATEGORIES]

export async function listCategories(): Promise<Category[]> {
  return delay([...categories])
}

export async function createCategory(name: string, parentId?: string): Promise<Category> {
  const category: Category = {
    id: `cat-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parentId,
    productCount: 0,
  }
  categories.push(category)
  return delay(category)
}

export async function deleteCategory(id: string): Promise<void> {
  const index = categories.findIndex((c) => c.id === id)
  if (index !== -1) categories.splice(index, 1)
  for (const category of categories) {
    if (category.parentId === id) category.parentId = undefined
  }
  return delay(undefined)
}
