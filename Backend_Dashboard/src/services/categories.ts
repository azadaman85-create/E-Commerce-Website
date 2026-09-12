import { api } from './http'
import type { Category } from '../types'

export async function listCategories(): Promise<Category[]> {
  return api<Category[]>('/api/admin/categories')
}

export async function createCategory(name: string, parentId?: string): Promise<Category> {
  return api<Category>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name, parentId }),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  await api<void>(`/api/admin/categories/${id}`, { method: 'DELETE' })
}
