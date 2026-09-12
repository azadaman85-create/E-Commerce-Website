import { api } from './http'
import type { Brand } from '../types'

export async function listBrands(): Promise<Brand[]> {
  return api<Brand[]>('/api/admin/brands')
}

export async function createBrand(name: string): Promise<Brand> {
  return api<Brand>('/api/admin/brands', { method: 'POST', body: JSON.stringify({ name }) })
}

export async function deleteBrand(id: string): Promise<void> {
  await api<void>(`/api/admin/brands/${id}`, { method: 'DELETE' })
}
