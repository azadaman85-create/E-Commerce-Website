import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { Tabs } from '../../components/Tabs'
import { InvoiceModal } from './InvoiceModal'
import { listOrders, ORDER_STATUS_LABELS } from '../../services/orders'
import type { Order, OrderStatus } from '../../types'
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

const TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Pending' },
  { key: 'packing', label: 'Packing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returned', label: 'Returned' },
  { key: 'refunded', label: 'Refunded' },
]

export function OrdersPage() {
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)

  useEffect(() => {
    setLoading(true)
    listOrders(tab === 'all' ? undefined : tab).then((result) => {
      setOrders(result)
      setLoading(false)
    })
  }, [tab])

  const columns: DataTableColumn<Order>[] = [
    { key: 'orderNumber', header: 'Order', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (o) => o.customerName },
    {
      key: 'items',
      header: 'Items',
      render: (o) => `${o.items.reduce((sum, i) => sum + i.qty, 0)} item(s)`,
    },
    { key: 'total', header: 'Total', render: (o) => formatCurrency(o.total) },
    {
      key: 'payment',
      header: 'Payment',
      render: (o) => (
        <StatusBadge
          label={o.paymentStatus}
          tone={o.paymentStatus === 'paid' ? 'active' : o.paymentStatus === 'pending' ? 'warning' : 'inactive'}
        />
      ),
    },
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
        <div className="flex justify-end gap-1">
          {o.paymentStatus === 'paid' && (
            <button
              onClick={() => setInvoiceOrder(o)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bone-deep"
            >
              Invoice
            </button>
          )}
          <Link
            to={`/orders/${o.id}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-bone-deep"
          >
            View
          </Link>
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">{orders.length} orders</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={(key) => setTab(key as OrderStatus | 'all')} />

      <DataTable columns={columns} rows={orders} getRowId={(o) => o.id} isLoading={loading} />

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  )
}
