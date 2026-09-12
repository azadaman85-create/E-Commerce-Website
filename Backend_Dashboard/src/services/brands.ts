import { BRANDS } from './mockData'
import type { Brand } from '../types'

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const brands = [...BRANDS]

export async function listBrands(): Promise<Brand[]> {
  return delay([...brands])
}

export async function createBrand(name: string): Promise<Brand> {
  const brand: Brand = {
    id: `brand-${Date.now()}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    productCount: 0,
  }
  brands.push(brand)
  return delay(brand)
}

export async function deleteBrand(id: string): Promise<void> {
  const index = brands.findIndex((b) => b.id === id)
  if (index !== -1) brands.splice(index, 1)
  return delay(undefined)
}
