import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Stepper } from '../../components/Stepper'
import { StatusBadge, type StatusTone } from '../../components/StatusBadge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { InvoiceModal } from './InvoiceModal'
import { useToast } from '../../hooks/useToast'
import {
  getOrder,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  updateOrderStatus,
} from '../../services/orders'
import type { Order, OrderStatus } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'

const BRANCH_STATUSES: OrderStatus[] = ['cancelled', 'returned', 'refunded']

export function OrderDetailPage() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  const refresh = () => {
    if (!id) return
    setLoading(true)
    getOrder(id).then((found) => {
      setOrder(found ?? null)
      setLoading(false)
    })
  }

  useEffect(refresh, [id])

  if (loading) return <p className="text-ink-soft">Loading order…</p>
  if (!order) return <p className="text-ink-soft">Order not found.</p>

  const isBranched = BRANCH_STATUSES.includes(order.status)
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status)
  const nextStatus = !isBranched ? ORDER_STATUS_FLOW[currentIndex + 1] : undefined

  const advance = async () => {
    if (!nextStatus) return
    await updateOrderStatus(order.id, nextStatus)
    showToast(`Order moved to ${ORDER_STATUS_LABELS[nextStatus]}`, 'success')
    refresh()
  }

  const cancelOrder = async () => {
    await updateOrderStatus(order.id, 'cancelled')
    showToast('Order cancelled', 'success')
    setCancelConfirm(false)
    refresh()
  }

  const paymentTone: StatusTone =
    order.paymentStatus === 'paid' ? 'active' : order.paymentStatus === 'pending' ? 'warning' : 'inactive'

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="text-sm text-ink-soft hover:text-ink">
            ← Back to orders
          </Link>
          <h1 className="mt-1 font-display text-3xl text-ink">{order.orderNumber}</h1>
          <p className="text-sm text-ink-soft">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.paymentStatus === 'paid' && (
            <button
              onClick={() => setShowInvoice(true)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
            >
              Print invoice
            </button>
          )}
          {!isBranched && order.status !== 'delivered' && (
            <>
              <button
                onClick={() => setCancelConfirm(true)}
                className="rounded-lg border border-rust/40 px-4 py-2 text-sm font-medium text-rust transition-colors hover:bg-rust-soft"
              >
                Cancel order
              </button>
              {nextStatus && (
                <button
                  onClick={advance}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
                >
                  Mark as {ORDER_STATUS_LABELS[nextStatus]}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bone-soft p-5">
        <Stepper
          steps={ORDER_STATUS_FLOW.map((s) => ({ key: s, label: ORDER_STATUS_LABELS[s] }))}
          currentIndex={currentIndex}
          isBranched={isBranched}
          branchLabel={isBranched ? `Order ${ORDER_STATUS_LABELS[order.status].toLowerCase()}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bone-soft p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg text-ink">Items</h2>
          <div className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <img src={item.image} alt="" className="h-16 w-12 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-ink">{item.productName}</p>
                  <p className="text-xs text-ink-soft">
                    {item.size} / {item.color} × {item.qty}
                  </p>
                </div>
                <span className="text-sm font-medium text-ink">
                  {formatCurrency(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sage">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 font-medium text-ink">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-bone-soft p-5">
            <h2 className="mb-2 text-lg text-ink">Customer</h2>
            <p className="text-sm text-ink">{order.customerName}</p>
            <Link
              to={`/customers/${order.customerId}`}
              className="text-xs text-accent hover:underline"
            >
              View customer profile
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-bone-soft p-5">
            <h2 className="mb-2 text-lg text-ink">Payment</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{order.paymentMethod}</span>
              <StatusBadge label={order.paymentStatus} tone={paymentTone} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bone-soft p-5">
            <h2 className="mb-2 text-lg text-ink">Shipping address</h2>
            <AddressBlock address={order.shippingAddress} />
          </div>

          <div className="rounded-2xl border border-border bg-bone-soft p-5">
            <h2 className="mb-2 text-lg text-ink">Billing address</h2>
            <AddressBlock address={order.billingAddress} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelConfirm}
        title="Cancel this order?"
        message={`This will cancel order ${order.orderNumber}. This action cannot be undone.`}
        confirmLabel="Cancel order"
        danger
        onConfirm={cancelOrder}
        onCancel={() => setCancelConfirm(false)}
      />

      <InvoiceModal order={showInvoice ? order : null} onClose={() => setShowInvoice(false)} />
    </div>
  )
}

function AddressBlock({ address }: { address: Order['shippingAddress'] }) {
  return (
    <p className="text-sm leading-relaxed text-ink-soft">
      {address.line1}
      {address.line2 ? `, ${address.line2}` : ''}
      <br />
      {address.city}, {address.state} {address.zip}
      <br />
      {address.country}
      <br />
      {address.phone}
    </p>
  )
}
