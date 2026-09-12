import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import {
  getCategories,
  getCollections,
  getProduct,
  getTags,
  saveProduct,
} from '../../services/products'
import { listBrands } from '../../services/brands'
import type {
  Brand,
  Category,
  Collection,
  Product,
  ProductStatus,
  ProductVariant,
  Tag,
} from '../../types'

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const COLORS = ['Ink Black', 'Bone', 'Clay', 'Sage', 'Burgundy']

function emptyProduct(): Product {
  return {
    id: `p-${Date.now()}`,
    name: '',
    slug: '',
    sku: '',
    categoryId: '',
    collectionIds: [],
    brand: 'MI TRENDS',
    price: 0,
    salePrice: undefined,
    description: '',
    fabric: '',
    care: '',
    fit: '',
    sizeGuide: '',
    images: [],
    status: 'draft',
    rating: 0,
    reviewCount: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    tags: [],
    variants: [],
  }
}

export function ProductFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [product, setProduct] = useState<Product>(emptyProduct())
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L'])
  const [selectedColors, setSelectedColors] = useState<string[]>(['Ink Black', 'Bone'])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshLookups = () => {
    getCategories().then(setCategories)
    listBrands().then(setBrands)
    getCollections().then(setCollections)
    getTags().then(setTags)
  }

  useEffect(refreshLookups, [])

  useEffect(() => {
    if (!id) return
    getProduct(id).then((found) => {
      if (found) {
        setProduct(found)
        setSelectedSizes([...new Set(found.variants.map((v) => v.size))])
        setSelectedColors([...new Set(found.variants.map((v) => v.color))])
      }
    })
  }, [id])

  const discountPct =
    product.salePrice && product.price
      ? Math.round((1 - product.salePrice / product.price) * 100)
      : 0

  const update = <K extends keyof Product>(key: K, value: Product[K]) => {
    setProduct((prev) => ({ ...prev, [key]: value }))
  }

  const addFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    const urls = imageFiles.map((file) => URL.createObjectURL(file))
    update('images', [...product.images, ...urls])
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    update(
      'images',
      product.images.filter((_, i) => i !== index),
    )
  }

  const handleDrop = (index: number, e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
      setDragIndex(null)
      return
    }
    if (dragIndex === null || dragIndex === index) return
    const next = [...product.images]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    update('images', next)
    setDragIndex(null)
  }

  const handleZoneDrop = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    )
  }

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    )
  }

  useEffect(() => {
    setProduct((prev) => {
      const existing = new Map(prev.variants.map((v) => [`${v.size}-${v.color}`, v]))
      const variants: ProductVariant[] = []
      for (const color of selectedColors) {
        for (const size of selectedSizes) {
          const key = `${size}-${color}`
          variants.push(
            existing.get(key) ?? {
              id: `${prev.id}-${key}`,
              productId: prev.id,
              size,
              color,
              sku: `${prev.sku || 'SKU'}-${size}-${color.slice(0, 2).toUpperCase()}`,
              stock: 0,
              reserved: 0,
              threshold: 10,
            },
          )
        }
      }
      return { ...prev, variants }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSizes, selectedColors])

  const updateVariantStock = (variantId: string, stock: number) => {
    setProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.id === variantId ? { ...v, stock } : v)),
    }))
  }

  const toggleTag = (tagName: string) => {
    setProduct((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...prev.tags, tagName],
    }))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!product.name.trim()) next.name = 'Product name is required.'
    if (!product.sku.trim()) next.sku = 'SKU is required.'
    if (!product.categoryId) next.categoryId = 'Choose a category.'
    if (product.price <= 0) next.price = 'Price must be greater than 0.'
    if (product.salePrice != null && product.salePrice >= product.price) {
      next.salePrice = 'Sale price must be lower than the regular price.'
    }
    if (product.images.length === 0) next.images = 'Add at least one product image.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      showToast('Please fix the highlighted fields.', 'error')
      return
    }
    await saveProduct(product)
    showToast(isEditing ? 'Product updated' : 'Product created', 'success')
    navigate('/products')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">
          {isEditing ? 'Edit product' : 'Add product'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
          >
            Save product
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Basic info</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Product name" error={errors.name}>
            <input
              value={product.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="SKU" error={errors.sku}>
            <input
              value={product.sku}
              onChange={(e) => update('sku', e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Category" error={errors.categoryId}>
            <select
              value={product.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
              className="input"
            >
              <option value="">Select category</option>
              {categories
                .filter((c) => !c.parentId)
                .map((top) => (
                  <optgroup key={top.id} label={top.name}>
                    <option value={top.id}>{top.name}</option>
                    {categories
                      .filter((c) => c.parentId === top.id)
                      .map((child) => (
                        <option key={child.id} value={child.id}>
                          — {child.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <Link to="/products/categories" className="text-xs text-accent hover:underline">
              + Add new category / subcategory
            </Link>
          </Field>
          <Field label="Brand">
            <select
              value={product.brand}
              onChange={(e) => update('brand', e.target.value)}
              className="input"
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <Link to="/products/brands" className="text-xs text-accent hover:underline">
              + Add new brand
            </Link>
          </Field>
          <Field label="Collections">
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <Chip
                  key={c.id}
                  active={product.collectionIds.includes(c.id)}
                  onClick={() =>
                    setProduct((prev) => ({
                      ...prev,
                      collectionIds: prev.collectionIds.includes(c.id)
                        ? prev.collectionIds.filter((id2) => id2 !== c.id)
                        : [...prev.collectionIds, c.id],
                    }))
                  }
                >
                  {c.name}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Status">
            <select
              value={product.status}
              onChange={(e) => update('status', e.target.value as ProductStatus)}
              className="input"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Description & details</h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Description">
            <textarea
              value={product.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className="input"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Fabric & care">
              <textarea
                value={product.fabric}
                onChange={(e) => update('fabric', e.target.value)}
                rows={2}
                className="input"
              />
            </Field>
            <Field label="Fit">
              <textarea
                value={product.fit}
                onChange={(e) => update('fit', e.target.value)}
                rows={2}
                className="input"
              />
            </Field>
            <Field label="Size guide">
              <textarea
                value={product.sizeGuide}
                onChange={(e) => update('sizeGuide', e.target.value)}
                rows={2}
                className="input"
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-1 text-lg text-ink">Images</h2>
        <p className="mb-4 text-xs text-ink-soft">
          Click the + tile or drag image files here to upload — drag existing thumbnails to
          reorder. The first image is used as the main thumbnail.
        </p>
        {errors.images && <p className="mb-2 text-xs text-rust">{errors.images}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div
          onDragOver={(e: DragEvent) => e.preventDefault()}
          onDrop={handleZoneDrop}
          className="flex flex-wrap gap-3 rounded-xl border border-dashed border-transparent p-1 transition-colors"
        >
          {product.images.map((src, i) => (
            <div
              key={src + i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={(e: DragEvent) => handleDrop(i, e)}
              className="group relative h-32 w-24 cursor-grab rounded-xl border border-border bg-bone"
            >
              <img src={src} alt="" className="h-full w-full rounded-xl object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-accent px-2 py-0.5 text-[10px] text-bone-soft">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-bone-soft opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-ink-faint transition-colors hover:border-accent hover:text-accent"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-[10px]">Upload</span>
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Pricing</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Price (₹)" error={errors.price}>
            <input
              type="number"
              value={product.price || ''}
              onChange={(e) => update('price', Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Sale price (₹)" error={errors.salePrice}>
            <input
              type="number"
              value={product.salePrice ?? ''}
              onChange={(e) =>
                update('salePrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="input"
            />
          </Field>
          <Field label="Discount">
            <div className="input flex items-center bg-bone-deep text-ink-soft">
              {discountPct > 0 ? `${discountPct}% off` : '—'}
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Variants</h2>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Sizes">
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <Chip key={size} active={selectedSizes.includes(size)} onClick={() => toggleSize(size)}>
                  {size}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Colors">
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <Chip
                  key={color}
                  active={selectedColors.includes(color)}
                  onClick={() => toggleColor(color)}
                >
                  {color}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-soft">
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Color</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-3 py-2">{v.size}</td>
                  <td className="px-3 py-2">{v.color}</td>
                  <td className="px-3 py-2 text-ink-soft">{v.sku}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariantStock(v.id, Number(e.target.value))}
                      className="w-20 rounded-lg border border-border bg-bone px-2 py-1 text-sm focus:border-accent focus:outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bone-soft p-5">
        <h2 className="mb-4 text-lg text-ink">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Chip key={tag.id} active={product.tags.includes(tag.name)} onClick={() => toggleTag(tag.name)}>
              {tag.name}
            </Chip>
          ))}
        </div>
      </section>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {error && <span className="text-xs text-rust">{error}</span>}
    </label>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-border text-ink-soft hover:bg-bone-deep'
      }`}
    >
      {children}
    </button>
  )
}
