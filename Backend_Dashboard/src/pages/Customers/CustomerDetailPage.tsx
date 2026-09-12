import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { getCustomer, getCustomerOrders, getCustomerReviews } from '../../services/customers'
import { ORDER_STATUS_LABELS } from '../../services/orders'
import type { Customer, Order, OrderStatus, Review } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'

const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  new: 'neutral',
  confirmed: 'neutral',
  packing: 'warning',
  ready: 'warning',
  shipped: 'active',
  out_for_delivery: 'active',
  delivered: 'active',
  cancelled: 'inactive',
  returned: 'inactive',
  refunded: 'inactive',
}

export function CustomerDetailPage() {
  const { id } = useParams()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getCustomer(id), getCustomerOrders(id), getCustomerReviews(id)]).then(
      ([c, o, r]) => {
        setCustomer(c ?? null)
        setOrders(o)
        setReviews(r)
        setLoading(false)
      },
    )
  }, [id])

  if (loading) return <p className="text-ink-soft">Loading customer…</p>
  if (!customer) return <p className="text-ink-soft">Customer not found.</p>

  const orderColumns: DataTableColumn<Order>[] = [
    { key: 'order', header: 'Order', render: (o) => o.orderNumber },
    { key: 'total', header: 'Total', render: (o) => formatCurrency(o.total) },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge label={ORDER_STATUS_LABELS[o.status]} tone={STATUS_TONE[o.status]} />,
    },
    { key: 'date', header: 'Date', render: (o) => formatDate(o.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <Link to={`/orders/${o.id}`} className="text-xs text-accent hover:underline">
          View
        </Link>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <Link to="/customers" className="text-sm text-ink-soft hover:text-ink">
          ← Back to customers
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bone-soft p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-semibold text-bone-soft">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-xl text-ink">{customer.name}</h1>
              <StatusBadge
                label={customer.status === 'active' ? 'Active' : 'Inactive'}
                tone={customer.status === 'active' ? 'active' : 'inactive'}
              />
            </div>
          </div>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Email</dt>
              <dd className="text-ink">{customer.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Phone</dt>
              <dd className="text-ink">{customer.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Joined</dt>
              <dd className="text-ink">{formatDate(customer.joinedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Total orders</dt>
              <dd className="text-ink">{customer.totalOrders}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Total spent</dt>
              <dd className="text-ink">{formatCurrency(customer.totalSpent)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-bone-soft p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg text-ink">Addresses</h2>
          <div className="flex flex-col gap-3">
            {customer.addresses.map((address, i) => (
              <div key={i} className="rounded-xl border border-border p-3 text-sm text-ink-soft">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state}{' '}
                {address.zip}, {address.country}
                <br />
                {address.phone}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg text-ink">Orders</h2>
        <DataTable
          columns={orderColumns}
          rows={orders}
          getRowId={(o) => o.id}
          emptyMessage="No orders yet."
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg text-ink">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-faint">No reviews submitted yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-bone-soft p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{r.productName}</span>
                  <span className="text-ochre">{'★'.repeat(r.rating)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg text-ink">Wishlist</h2>
        <p className="text-sm text-ink-faint">Wishlist data will sync once storefront accounts are connected.</p>
      </div>
    </div>
  )
}
