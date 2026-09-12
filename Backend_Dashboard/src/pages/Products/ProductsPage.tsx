import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Pagination } from '../../components/Pagination'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { RowActionsMenu } from '../../components/RowActionsMenu'
import { useToast } from '../../hooks/useToast'
import {
  deleteProduct,
  duplicateProduct,
  getCategories,
  listProducts,
  setProductStatus,
} from '../../services/products'
import type { Category, Product, ProductStatus } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'

const STATUS_TONE: Record<ProductStatus, StatusTone> = {
  active: 'active',
  draft: 'neutral',
  archived: 'inactive',
}

const PAGE_SIZE = 8

export function ProductsPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [sortKey, setSortKey] = useState<'name' | 'price' | 'createdAt'>('createdAt')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | null>(null)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const refresh = () => {
    setLoading(true)
    listProducts({
      search: search || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
    }).then((result) => {
      setProducts(result)
      setLoading(false)
    })
  }

  useEffect(() => {
    refresh()
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId, status])

  const sorted = useMemo(() => {
    const copy = [...products]
    copy.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'price') return (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
      return a.createdAt < b.createdAt ? 1 : -1
    })
    return copy
  }, [products, sortKey])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === pageRows.length ? new Set() : new Set(pageRows.map((p) => p.id)),
    )
  }

  const handleToggleStatus = async (product: Product) => {
    const next: ProductStatus = product.status === 'active' ? 'archived' : 'active'
    await setProductStatus(product.id, next)
    refresh()
    showToast(`${product.name} ${next === 'active' ? 'enabled' : 'disabled'}`, 'success')
  }

  const handleDuplicate = async (product: Product) => {
    await duplicateProduct(product.id)
    refresh()
    showToast(`Duplicated “${product.name}”`, 'success')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteProduct(deleteTarget.id)
    setDeleteTarget(null)
    refresh()
    showToast('Product deleted', 'success')
  }

  const runBulkAction = async () => {
    const ids = [...selected]
    if (bulkAction === 'delete') {
      await Promise.all(ids.map((id) => deleteProduct(id)))
      showToast(`${ids.length} products deleted`, 'success')
    } else if (bulkAction === 'activate') {
      await Promise.all(ids.map((id) => setProductStatus(id, 'active')))
      showToast(`${ids.length} products enabled`, 'success')
    } else if (bulkAction === 'deactivate') {
      await Promise.all(ids.map((id) => setProductStatus(id, 'archived')))
      showToast(`${ids.length} products disabled`, 'success')
    }
    setSelected(new Set())
    setBulkAction(null)
    refresh()
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'select',
      header: '',
      render: (p) => (
        <input
          type="checkbox"
          checked={selected.has(p.id)}
          onChange={() => toggleSelect(p.id)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.images[0]} alt="" className="h-14 w-11 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{p.name}</p>
            <p className="truncate text-xs text-ink-soft">
              {p.sku} · {p.brand}
              {p.rating > 0 && <span className="text-ink-faint"> · ★ {p.rating.toFixed(1)}</span>}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => categoryName(p.categoryId) },
    {
      key: 'price',
      header: 'Price',
      render: (p) =>
        p.salePrice ? (
          <div>
            <span className="font-medium text-ink">{formatCurrency(p.salePrice)}</span>{' '}
            <span className="text-xs text-ink-faint line-through">{formatCurrency(p.price)}</span>
          </div>
        ) : (
          formatCurrency(p.price)
        ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
        const threshold = p.variants[0]?.threshold ?? 10
        return <ProgressBar current={totalStock} threshold={threshold} max={threshold * 4} />
      },
    },
    {
      key: 'variants',
      header: 'Colors',
      render: (p) => {
        const colors = [...new Set(p.variants.map((v) => v.color))].slice(0, 2)
        return (
          <div className="flex flex-wrap gap-1">
            {colors.map((c) => (
              <span
                key={c}
                className="rounded-full bg-bone-deep px-2 py-0.5 text-xs text-ink-soft"
              >
                {c}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <StatusBadge
          label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
          tone={STATUS_TONE[p.status]}
        />
      ),
    },
    { key: 'created', header: 'Created', render: (p) => formatDate(p.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex justify-end">
          <RowActionsMenu
            actions={[
              { label: 'View', onClick: () => setViewProduct(p) },
              { label: 'Edit', onClick: () => navigate(`/products/${p.id}/edit`) },
              { label: 'Duplicate', onClick: () => handleDuplicate(p) },
              {
                label: p.status === 'active' ? 'Disable' : 'Enable',
                onClick: () => handleToggleStatus(p),
              },
              { label: 'Delete', onClick: () => setDeleteTarget(p), tone: 'danger' },
            ]}
          />
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">{products.length} products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/products/categories"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
          >
            Categories
          </Link>
          <Link
            to="/products/brands"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
          >
            Brands
          </Link>
          <Link
            to="/products/inventory"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
          >
            Inventory
          </Link>
          <Link
            to="/products/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
          >
            + Add product
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-bone-soft p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU…"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-bone px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-border bg-bone px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All categories</option>
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProductStatus | '')}
          className="rounded-lg border border-border bg-bone px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className="rounded-lg border border-border bg-bone px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="createdAt">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
          <span className="font-medium text-ink">{selected.size} selected</span>
          <button
            onClick={() => setBulkAction('activate')}
            className="rounded-lg px-3 py-1.5 text-ink-soft transition-colors hover:bg-bone-soft"
          >
            Enable
          </button>
          <button
            onClick={() => setBulkAction('deactivate')}
            className="rounded-lg px-3 py-1.5 text-ink-soft transition-colors hover:bg-bone-soft"
          >
            Disable
          </button>
          <button
            onClick={() => setBulkAction('delete')}
            className="rounded-lg px-3 py-1.5 text-rust transition-colors hover:bg-bone-soft"
          >
            Delete
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-ink-faint">
            Clear
          </button>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center gap-2 px-1 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={pageRows.length > 0 && selected.size === pageRows.length}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Select all on page
        </div>
        <DataTable
          columns={columns}
          rows={pageRows}
          getRowId={(p) => p.id}
          isLoading={loading}
          emptyMessage="No products match these filters."
        />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Modal
        isOpen={!!viewProduct}
        onClose={() => setViewProduct(null)}
        title={viewProduct?.name ?? ''}
      >
        {viewProduct && (
          <div className="flex flex-col gap-3">
            <img
              src={viewProduct.images[0]}
              alt=""
              className="h-56 w-full rounded-xl object-cover"
            />
            <p className="text-ink-soft">{viewProduct.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-ink-soft">
              <span>SKU: {viewProduct.sku}</span>
              <span>Brand: {viewProduct.brand}</span>
              <span>Fabric: {viewProduct.fabric}</span>
              <span>Fit: {viewProduct.fit}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete product?"
        message={`This will permanently remove “${deleteTarget?.name}” from the catalogue.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!bulkAction}
        title="Apply bulk action?"
        message={`This will ${bulkAction} ${selected.size} selected product${selected.size === 1 ? '' : 's'}.`}
        confirmLabel="Apply"
        danger={bulkAction === 'delete'}
        onConfirm={runBulkAction}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  )
}
