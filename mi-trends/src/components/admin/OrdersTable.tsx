"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Column, DataTable, PageHeader } from "@/components/admin/AdminUI";
import { FulfillmentBadge, PaymentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, toCsv } from "@/lib/utils";
import type { FulfillmentStatus, OrderWithItems, PaymentStatus } from "@/types";

const FULFILLMENT: FulfillmentStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export function OrdersTable({
  orders,
  currencySymbol,
  currencyCode,
}: {
  orders: OrderWithItems[];
  currencySymbol: string;
  currencyCode: string;
}) {
  const toast = useToast();

  const [fulfillment, setFulfillment] = useState("");
  const [payment, setPayment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");

  const money = (n: number) => formatCurrency(Number(n), currencySymbol, currencyCode);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (fulfillment && order.fulfillment_status !== fulfillment) return false;
      if (payment && order.payment_status !== payment) return false;

      const placedAt = new Date(order.created_at).getTime();
      if (from && placedAt < new Date(from).getTime()) return false;
      // `to` is a date with no time, so extend it to the end of that day.
      if (to && placedAt > new Date(to).getTime() + 86_399_999) return false;

      const total = Number(order.total);
      if (minTotal && total < Number(minTotal)) return false;
      if (maxTotal && total > Number(maxTotal)) return false;

      return true;
    });
  }, [orders, fulfillment, payment, from, to, minTotal, maxTotal]);

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Nothing to export", "No orders match the current filters.");
      return;
    }

    const csv = toCsv(
      filtered.map((order) => ({
        order_number: order.order_number,
        placed_at: order.created_at,
        customer: order.shipping_address?.full_name ?? "",
        email: order.email,
        items: order.order_items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: order.subtotal,
        discount: order.discount_amount,
        shipping: order.shipping_cost,
        tax: order.tax_amount,
        total: order.total,
        coupon: order.coupon_code ?? "",
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        tracking_number: order.tracking_number ?? "",
      })),
      [
        "order_number",
        "placed_at",
        "customer",
        "email",
        "items",
        "subtotal",
        "discount",
        "shipping",
        "tax",
        "total",
        "coupon",
        "payment_status",
        "fulfillment_status",
        "tracking_number",
      ],
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} order(s)`);
  }

  const columns: Column<OrderWithItems>[] = [
    {
      key: "order_number",
      header: "Order",
      sortValue: (o) => o.order_number,
      render: (o) => <span className="font-medium text-ink">{o.order_number}</span>,
    },
    {
      key: "created_at",
      header: "Date",
      sortValue: (o) => new Date(o.created_at).getTime(),
      render: (o) => <span className="text-muted">{formatDate(o.created_at)}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (o) => o.shipping_address?.full_name ?? o.email,
      render: (o) => (
        <div className="min-w-0">
          <span className="block truncate text-ink">
            {o.shipping_address?.full_name ?? "—"}
          </span>
          <span className="block truncate text-caption normal-case tracking-normal text-muted">
            {o.email}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      sortValue: (o) => o.order_items.reduce((sum, i) => sum + i.quantity, 0),
      render: (o) => (
        <span className="text-muted tabular-nums">
          {o.order_items.reduce((sum, i) => sum + i.quantity, 0)}
        </span>
      ),
    },
    {
      key: "payment_status",
      header: "Payment",
      sortValue: (o) => o.payment_status,
      render: (o) => <PaymentBadge status={o.payment_status} />,
    },
    {
      key: "fulfillment_status",
      header: "Fulfillment",
      sortValue: (o) => o.fulfillment_status,
      render: (o) => <FulfillmentBadge status={o.fulfillment_status} />,
    },
    {
      key: "total",
      header: "Total",
      sortValue: (o) => Number(o.total),
      render: (o) => (
        <span className="font-medium text-ink tabular-nums">{money(o.total)}</span>
      ),
    },
  ];

  const hasFilters =
    fulfillment || payment || from || to || minTotal || maxTotal;

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} order${orders.length === 1 ? "" : "s"} in total.`}
        action={
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        }
      />

      <div className="card-surface mb-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Fulfillment status"
            value={fulfillment}
            onChange={(e) => setFulfillment(e.target.value)}
          >
            <option value="">All</option>
            {FULFILLMENT.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Select
            label="Payment status"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
          >
            <option value="">All</option>
            {PAYMENT.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="from-date"
              className="text-caption uppercase tracking-[0.1em] text-muted"
            >
              From
            </label>
            <input
              id="from-date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-2 h-11 w-full rounded-sm border border-ink/12 px-3 text-body-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="to-date"
              className="text-caption uppercase tracking-[0.1em] text-muted"
            >
              To
            </label>
            <input
              id="to-date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-2 h-11 w-full rounded-sm border border-ink/12 px-3 text-body-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="min-total"
              className="text-caption uppercase tracking-[0.1em] text-muted"
            >
              Min total
            </label>
            <input
              id="min-total"
              type="number"
              min="0"
              value={minTotal}
              onChange={(e) => setMinTotal(e.target.value)}
              className="mt-2 h-11 w-full rounded-sm border border-ink/12 px-3 text-body-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="max-total"
              className="text-caption uppercase tracking-[0.1em] text-muted"
            >
              Max total
            </label>
            <input
              id="max-total"
              type="number"
              min="0"
              value={maxTotal}
              onChange={(e) => setMaxTotal(e.target.value)}
              className="mt-2 h-11 w-full rounded-sm border border-ink/12 px-3 text-body-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFulfillment("");
              setPayment("");
              setFrom("");
              setTo("");
              setMinTotal("");
              setMaxTotal("");
            }}
            className="mt-5 cursor-pointer text-caption normal-case tracking-normal text-accent underline underline-offset-4"
          >
            Clear all filters
          </button>
        )}
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(o) => o.id}
        rowHref={(o) => `/admin/orders/${o.id}`}
        searchValue={(o) =>
          `${o.order_number} ${o.email} ${o.shipping_address?.full_name ?? ""}`
        }
        searchPlaceholder="Search by order number, name or email…"
        emptyMessage="No orders match these filters."
      />
    </>
  );
}
