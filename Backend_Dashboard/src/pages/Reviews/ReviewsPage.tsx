import { useEffect, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../hooks/useToast'
import { listReviews, setReviewStatus } from '../../services/reviews'
import type { Review } from '../../types'
import { formatDate } from '../../lib/format'

const TABS: { key: Review['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

const STATUS_TONE: Record<Review['status'], StatusTone> = {
  pending: 'warning',
  approved: 'active',
  rejected: 'inactive',
}

export function ReviewsPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<Review['status'] | 'all'>('pending')
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    listReviews(tab === 'all' ? undefined : tab).then((result) => {
      setReviews(result)
      setLoading(false)
    })
  }

  useEffect(refresh, [tab])

  const moderate = async (review: Review, status: Review['status']) => {
    await setReviewStatus(review.id, status)
    showToast(`Review ${status}`, 'success')
    refresh()
  }

  const columns: DataTableColumn<Review>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (r) => <span className="font-medium text-ink">{r.productName}</span>,
    },
    { key: 'customer', header: 'Customer', render: (r) => r.customerName },
    { key: 'rating', header: 'Rating', render: (r) => <span className="text-ochre">{'★'.repeat(r.rating)}</span> },
    {
      key: 'comment',
      header: 'Comment',
      render: (r) => <span className="line-clamp-2 max-w-xs text-ink-soft">{r.comment}</span>,
    },
    { key: 'date', header: 'Date', render: (r) => formatDate(r.createdAt) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge label={r.status} tone={STATUS_TONE[r.status]} />,
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => moderate(r, 'approved')}
              className="rounded-lg px-2 py-1 text-xs font-medium text-sage transition-colors hover:bg-sage-soft"
            >
              Approve
            </button>
            <button
              onClick={() => moderate(r, 'rejected')}
              className="rounded-lg px-2 py-1 text-xs font-medium text-rust transition-colors hover:bg-rust-soft"
            >
              Reject
            </button>
          </div>
        ) : null,
      className: 'text-right',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-ink-soft">Moderate customer reviews before they go live.</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => setTab(key as Review['status'] | 'all')} />

      <DataTable columns={columns} rows={reviews} getRowId={(r) => r.id} isLoading={loading} />
    </div>
  )
}
