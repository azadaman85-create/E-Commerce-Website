import { useEffect, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { Tabs } from '../../components/Tabs'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../hooks/useToast'
import {
  createCoupon,
  createPromotion,
  deleteCoupon,
  deletePromotion,
  listCoupons,
  listPromotions,
} from '../../services/marketing'
import type { Coupon, CouponType, Promotion } from '../../types'
import { formatDate } from '../../lib/format'

const COUPON_TONE: Record<Coupon['status'], StatusTone> = {
  active: 'active',
  scheduled: 'warning',
  expired: 'inactive',
}

const PROMO_TONE: Record<Promotion['status'], StatusTone> = {
  active: 'active',
  scheduled: 'warning',
  ended: 'inactive',
}

function emptyCoupon() {
  return {
    code: '',
    type: 'percentage' as CouponType,
    value: 10,
    minOrder: 0,
    usageLimit: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    status: 'active' as Coupon['status'],
  }
}

function emptyPromotion() {
  return {
    title: '',
    bannerImage: 'https://picsum.photos/seed/new-promo/480/240',
    linkUrl: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    status: 'scheduled' as Promotion['status'],
  }
}

export function MarketingPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'coupons' | 'promotions'>('coupons')

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  const [couponModal, setCouponModal] = useState(false)
  const [promoModal, setPromoModal] = useState(false)
  const [couponForm, setCouponForm] = useState(emptyCoupon())
  const [promoForm, setPromoForm] = useState(emptyPromotion())
  const [deleteCouponTarget, setDeleteCouponTarget] = useState<Coupon | null>(null)
  const [deletePromoTarget, setDeletePromoTarget] = useState<Promotion | null>(null)

  const refresh = () => {
    setLoading(true)
    Promise.all([listCoupons(), listPromotions()]).then(([c, p]) => {
      setCoupons(c)
      setPromotions(p)
      setLoading(false)
    })
  }

  useEffect(refresh, [])

  const submitCoupon = async () => {
    if (!couponForm.code.trim()) {
      showToast('Enter a coupon code.', 'error')
      return
    }
    await createCoupon(couponForm)
    showToast('Coupon created', 'success')
    setCouponModal(false)
    setCouponForm(emptyCoupon())
    refresh()
  }

  const submitPromotion = async () => {
    if (!promoForm.title.trim()) {
      showToast('Enter a promotion title.', 'error')
      return
    }
    await createPromotion(promoForm)
    showToast('Promotion created', 'success')
    setPromoModal(false)
    setPromoForm(emptyPromotion())
    refresh()
  }

  const confirmDeleteCoupon = async () => {
    if (!deleteCouponTarget) return
    await deleteCoupon(deleteCouponTarget.id)
    setDeleteCouponTarget(null)
    showToast('Coupon deleted', 'success')
    refresh()
  }

  const confirmDeletePromo = async () => {
    if (!deletePromoTarget) return
    await deletePromotion(deletePromoTarget.id)
    setDeletePromoTarget(null)
    showToast('Promotion deleted', 'success')
    refresh()
  }

  const couponColumns: DataTableColumn<Coupon>[] = [
    { key: 'code', header: 'Code', render: (c) => <span className="font-medium text-ink">{c.code}</span> },
    {
      key: 'value',
      header: 'Discount',
      render: (c) => (c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`),
    },
    { key: 'minOrder', header: 'Min. order', render: (c) => `₹${c.minOrder.toLocaleString('en-IN')}` },
    { key: 'usage', header: 'Usage', render: (c) => `${c.usedCount} / ${c.usageLimit}` },
    {
      key: 'validity',
      header: 'Validity',
      render: (c) => `${formatDate(c.startDate)} – ${formatDate(c.endDate)}`,
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge label={c.status} tone={COUPON_TONE[c.status]} /> },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <button
          onClick={() => setDeleteCouponTarget(c)}
          className="rounded-lg px-2 py-1 text-xs text-rust transition-colors hover:bg-rust-soft"
        >
          Delete
        </button>
      ),
      className: 'text-right',
    },
  ]

  const promoColumns: DataTableColumn<Promotion>[] = [
    {
      key: 'banner',
      header: 'Banner',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.bannerImage} alt="" className="h-12 w-20 rounded-lg object-cover" />
          <span className="font-medium text-ink">{p.title}</span>
        </div>
      ),
    },
    { key: 'link', header: 'Link', render: (p) => <span className="text-ink-soft">{p.linkUrl}</span> },
    {
      key: 'validity',
      header: 'Validity',
      render: (p) => `${formatDate(p.startDate)} – ${formatDate(p.endDate)}`,
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge label={p.status} tone={PROMO_TONE[p.status]} /> },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <button
          onClick={() => setDeletePromoTarget(p)}
          className="rounded-lg px-2 py-1 text-xs text-rust transition-colors hover:bg-rust-soft"
        >
          Delete
        </button>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Marketing</h1>
          <p className="mt-1 text-sm text-ink-soft">Coupons, discounts, and promotional banners.</p>
        </div>
        <button
          onClick={() => (tab === 'coupons' ? setCouponModal(true) : setPromoModal(true))}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
        >
          + New {tab === 'coupons' ? 'coupon' : 'promotion'}
        </button>
      </div>

      <Tabs
        tabs={[
          { key: 'coupons', label: 'Coupons', count: coupons.length },
          { key: 'promotions', label: 'Promotions', count: promotions.length },
        ]}
        active={tab}
        onChange={(key) => setTab(key as typeof tab)}
      />

      {tab === 'coupons' ? (
        <DataTable columns={couponColumns} rows={coupons} getRowId={(c) => c.id} isLoading={loading} />
      ) : (
        <DataTable columns={promoColumns} rows={promotions} getRowId={(p) => p.id} isLoading={loading} />
      )}

      <Modal
        isOpen={couponModal}
        onClose={() => setCouponModal(false)}
        title="New coupon"
        footer={
          <>
            <button
              onClick={() => setCouponModal(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
            >
              Cancel
            </button>
            <button
              onClick={submitCoupon}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Create coupon
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Code</span>
            <input
              value={couponForm.code}
              onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Type</span>
            <select
              value={couponForm.type}
              onChange={(e) => setCouponForm((f) => ({ ...f, type: e.target.value as CouponType }))}
              className="input"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Value</span>
            <input
              type="number"
              value={couponForm.value}
              onChange={(e) => setCouponForm((f) => ({ ...f, value: Number(e.target.value) }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Min. order (₹)</span>
            <input
              type="number"
              value={couponForm.minOrder}
              onChange={(e) => setCouponForm((f) => ({ ...f, minOrder: Number(e.target.value) }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Usage limit</span>
            <input
              type="number"
              value={couponForm.usageLimit}
              onChange={(e) => setCouponForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Start date</span>
            <input
              type="date"
              value={couponForm.startDate}
              onChange={(e) => setCouponForm((f) => ({ ...f, startDate: e.target.value }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">End date</span>
            <input
              type="date"
              value={couponForm.endDate}
              onChange={(e) => setCouponForm((f) => ({ ...f, endDate: e.target.value }))}
              className="input"
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={promoModal}
        onClose={() => setPromoModal(false)}
        title="New promotion"
        footer={
          <>
            <button
              onClick={() => setPromoModal(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
            >
              Cancel
            </button>
            <button
              onClick={submitPromotion}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Create promotion
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Title</span>
            <input
              value={promoForm.title}
              onChange={(e) => setPromoForm((f) => ({ ...f, title: e.target.value }))}
              className="input"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Link URL</span>
            <input
              value={promoForm.linkUrl}
              onChange={(e) => setPromoForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Start date</span>
            <input
              type="date"
              value={promoForm.startDate}
              onChange={(e) => setPromoForm((f) => ({ ...f, startDate: e.target.value }))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">End date</span>
            <input
              type="date"
              value={promoForm.endDate}
              onChange={(e) => setPromoForm((f) => ({ ...f, endDate: e.target.value }))}
              className="input"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCouponTarget}
        title="Delete coupon?"
        message={`This will remove the coupon “${deleteCouponTarget?.code}”.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteCoupon}
        onCancel={() => setDeleteCouponTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!deletePromoTarget}
        title="Delete promotion?"
        message={`This will remove “${deletePromoTarget?.title}”.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeletePromo}
        onCancel={() => setDeletePromoTarget(null)}
      />
    </div>
  )
}
