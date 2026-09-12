import { Modal } from '../../components/Modal'
import logo from '../../assets/logo.jpeg'
import type { Order } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'

interface InvoiceModalProps {
  order: Order | null
  onClose: () => void
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  if (!order) return null

  const isPaid = order.paymentStatus === 'paid'

  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      title={`Invoice — ${order.orderNumber}`}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-bone-deep"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            disabled={!isPaid}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print / Save as PDF
          </button>
        </>
      }
    >
      {!isPaid && (
        <p className="mb-4 rounded-lg bg-ochre-soft px-3 py-2 text-xs text-ochre">
          This order isn't paid yet — invoices can only be printed for paid orders.
        </p>
      )}

      <div id="invoice-print-area" className="max-h-[65vh] overflow-y-auto pr-1">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MI TRENDS" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-display text-lg text-ink">MI TRENDS</p>
              <p className="text-xs text-ink-soft">
                14 Textile Lane, Bandra West
                <br />
                Mumbai, Maharashtra 400050, India
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-display text-xl text-ink">INVOICE</h2>
            <p className="text-xs text-ink-soft">Invoice #{order.orderNumber}</p>
            <p className="text-xs text-ink-soft">Date: {formatDate(order.createdAt)}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                isPaid ? 'bg-sage-soft text-sage' : 'bg-ochre-soft text-ochre'
              }`}
            >
              {isPaid ? 'PAID' : order.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-border py-4 text-sm">
          <div>
            <p className="mb-1 font-medium text-ink">Bill to</p>
            <p className="text-ink-soft">{order.customerName}</p>
            <p className="text-ink-soft">
              {order.billingAddress.line1}
              {order.billingAddress.line2 ? `, ${order.billingAddress.line2}` : ''}
              <br />
              {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}
              <br />
              {order.billingAddress.country}
            </p>
          </div>
          <div>
            <p className="mb-1 font-medium text-ink">Ship to</p>
            <p className="text-ink-soft">{order.customerName}</p>
            <p className="text-ink-soft">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zip}
              <br />
              {order.shippingAddress.country}
            </p>
          </div>
        </div>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-ink-soft">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Size / Color</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="py-2 text-ink">{item.productName}</td>
                <td className="py-2 text-ink-soft">
                  {item.size} / {item.color}
                </td>
                <td className="py-2 text-right text-ink-soft">{item.qty}</td>
                <td className="py-2 text-right text-ink-soft">{formatCurrency(item.price)}</td>
                <td className="py-2 text-right text-ink">
                  {formatCurrency(item.price * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 flex w-56 flex-col gap-1.5 text-sm">
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
          <div className="flex justify-between text-xs text-ink-faint">
            <span>Paid via</span>
            <span>{order.paymentMethod}</span>
          </div>
        </div>

        <p className="mt-6 border-t border-border pt-4 text-center text-xs text-ink-faint">
          Thank you for shopping with MI TRENDS. For questions about this invoice, contact
          support@mitrends.com.
        </p>
      </div>
    </Modal>
  )
}
