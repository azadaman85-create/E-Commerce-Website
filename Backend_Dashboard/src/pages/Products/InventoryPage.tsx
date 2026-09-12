import { useEffect, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { ProgressBar } from '../../components/ProgressBar'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { Modal } from '../../components/Modal'
import { useToast } from '../../hooks/useToast'
import { adjustStock, getInventoryLogs, listProducts } from '../../services/products'
import type { InventoryLog, Product, ProductVariant } from '../../types'
import { formatDate } from '../../lib/format'

interface VariantRow {
  variant: ProductVariant
  productName: string
  image: string
}

export function InventoryPage() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<VariantRow[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustTarget, setAdjustTarget] = useState<VariantRow | null>(null)
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')

  const refresh = () => {
    setLoading(true)
    Promise.all([listProducts(), getInventoryLogs()]).then(([products, inventoryLogs]) => {
      const nextRows: VariantRow[] = (products as Product[]).flatMap((p) =>
        p.variants.map((variant) => ({ variant, productName: p.name, image: p.images[0] })),
      )
      setRows(nextRows)
      setLogs(inventoryLogs)
      setLoading(false)
    })
  }

  useEffect(refresh, [])

  const statusFor = (available: number, threshold: number): { label: string; tone: StatusTone } => {
    if (available <= 0) return { label: 'Out of stock', tone: 'inactive' }
    if (available <= threshold) return { label: 'Low stock', tone: 'warning' }
    return { label: 'In stock', tone: 'active' }
  }

  const submitAdjustment = async () => {
    if (!adjustTarget || adjustAmount === 0 || !adjustReason.trim()) {
      showToast('Enter an amount and a reason.', 'error')
      return
    }
    await adjustStock(
      adjustTarget.variant.id,
      adjustTarget.productName,
      `${adjustTarget.variant.size} / ${adjustTarget.variant.color}`,
      adjustAmount,
      adjustReason,
      'Admin',
    )
    showToast('Stock adjusted', 'success')
    setAdjustTarget(null)
    setAdjustAmount(0)
    setAdjustReason('')
    refresh()
  }

  const columns: DataTableColumn<VariantRow>[] = [
    {
      key: 'product',
      header: 'Product / Variant',
      render: (r) => (
        <div className="flex items-center gap-3">
          <img src={r.image} alt="" className="h-12 w-9 rounded-lg object-cover" />
          <div>
            <p className="font-medium text-ink">{r.productName}</p>
            <p className="text-xs text-ink-soft">
              {r.variant.size} / {r.variant.color} — {r.variant.sku}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'current', header: 'Current', render: (r) => r.variant.stock },
    { key: 'reserved', header: 'Reserved', render: (r) => r.variant.reserved },
    {
      key: 'available',
      header: 'Available',
      render: (r) => {
        const available = r.variant.stock - r.variant.reserved
        return <ProgressBar current={available} threshold={r.variant.threshold} max={r.variant.threshold * 4} />
      },
    },
    { key: 'threshold', header: 'Threshold', render: (r) => r.variant.threshold },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const { label, tone } = statusFor(r.variant.stock - r.variant.reserved, r.variant.threshold)
        return <StatusBadge label={label} tone={tone} />
      },
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          onClick={() => setAdjustTarget(r)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bone-deep"
        >
          Adjust
        </button>
      ),
      className: 'text-right',
    },
  ]

  const logColumns: DataTableColumn<InventoryLog>[] = [
    { key: 'product', header: 'Product / Variant', render: (l) => `${l.productName} — ${l.variantLabel}` },
    {
      key: 'change',
      header: 'Change',
      render: (l) => (
        <span className={l.change >= 0 ? 'text-sage' : 'text-rust'}>
          {l.change >= 0 ? `+${l.change}` : l.change}
        </span>
      ),
    },
    { key: 'reason', header: 'Reason', render: (l) => l.reason },
    { key: 'by', header: 'Adjusted by', render: (l) => l.adjustedBy },
    { key: 'date', header: 'Date', render: (l) => formatDate(l.date) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Inventory</h1>
        <p className="mt-1 text-sm text-ink-soft">Per-variant stock across the catalogue.</p>
      </div>

      <DataTable columns={columns} rows={rows} getRowId={(r) => r.variant.id} isLoading={loading} />

      <div>
        <h2 className="mb-3 text-lg text-ink">Adjustment history</h2>
        <DataTable
          columns={logColumns}
          rows={logs}
          getRowId={(l) => l.id}
          emptyMessage="No adjustments logged yet."
        />
      </div>

      <Modal
        isOpen={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title="Adjust stock"
        footer={
          <>
            <button
              onClick={() => setAdjustTarget(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
            >
              Cancel
            </button>
            <button
              onClick={submitAdjustment}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Save adjustment
            </button>
          </>
        }
      >
        {adjustTarget && (
          <div className="flex flex-col gap-3">
            <p className="text-ink-soft">
              {adjustTarget.productName} — {adjustTarget.variant.size} / {adjustTarget.variant.color}
            </p>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Amount (use negative to remove)</span>
              <input
                type="number"
                value={adjustAmount || ''}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                className="input"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Reason</span>
              <input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Restock from supplier"
                className="input"
              />
            </label>
          </div>
        )}
      </Modal>
    </div>
  )
}
