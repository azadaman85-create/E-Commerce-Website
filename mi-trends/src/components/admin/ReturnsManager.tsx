"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Column, DataTable, PageHeader, StatCard } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import {
  RETURN_STATUS_LABELS,
  RETURN_STATUS_TONE,
} from "@/lib/returns";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReturnRequest, ReturnStatus } from "@/types";

const STATUSES: ReturnStatus[] = [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
];

export function ReturnsManager({
  returns: initial,
  currencySymbol,
  currencyCode,
}: {
  returns: ReturnRequest[];
  currencySymbol: string;
  currencyCode: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [returns, setReturns] = useState(initial);
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState<ReturnRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<ReturnStatus>("requested");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

  const money = (n: number) => formatCurrency(Number(n), currencySymbol, currencyCode);

  const filtered = useMemo(
    () =>
      statusFilter ? returns.filter((r) => r.status === statusFilter) : returns,
    [returns, statusFilter],
  );

  const openCount = returns.filter((r) =>
    ["requested", "approved"].includes(r.status),
  ).length;
  const refundedTotal = returns
    .filter((r) => r.status === "refunded")
    .reduce((sum, r) => sum + Number(r.refund_amount), 0);

  function review(request: ReturnRequest) {
    setOpen(request);
    setDraftStatus(request.status);
    setDraftNote(request.admin_note ?? "");
  }

  async function save() {
    if (!open) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("returns")
        .update({ status: draftStatus, admin_note: draftNote.trim() || null })
        .eq("id", open.id);

      if (error) {
        toast.error("Couldn't update the return", error.message);
        return;
      }

      setReturns((prev) =>
        prev.map((r) =>
          r.id === open.id
            ? { ...r, status: draftStatus, admin_note: draftNote.trim() || null }
            : r,
        ),
      );
      setOpen(null);
      toast.success(`Return marked ${RETURN_STATUS_LABELS[draftStatus].toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<ReturnRequest>[] = [
    {
      key: "order",
      header: "Order",
      sortValue: (r) => r.order_number,
      render: (r) => (
        <div className="min-w-0">
          <span className="block font-medium text-ink">{r.order_number}</span>
          <span className="block truncate text-caption normal-case tracking-normal text-muted">
            {r.email}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      sortValue: (r) => r.items.reduce((s, i) => s + i.quantity, 0),
      render: (r) => (
        <span className="text-muted">
          {r.items.reduce((s, i) => s + i.quantity, 0)} item
          {r.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      sortValue: (r) => r.reason,
      render: (r) => <span className="text-muted">{r.reason}</span>,
    },
    {
      key: "refund",
      header: "Refund",
      sortValue: (r) => Number(r.refund_amount),
      render: (r) => (
        <span className="tabular-nums text-ink">{money(r.refund_amount)}</span>
      ),
    },
    {
      key: "requested",
      header: "Requested",
      sortValue: (r) => new Date(r.created_at).getTime(),
      render: (r) => <span className="text-muted">{formatDate(r.created_at)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => r.status,
      render: (r) => (
        <Badge tone={RETURN_STATUS_TONE[r.status]}>
          {RETURN_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (r) => (
        <button
          type="button"
          onClick={() => review(r)}
          className="cursor-pointer rounded-sm px-3 py-1.5 text-caption normal-case tracking-normal text-accent underline underline-offset-4"
        >
          Review
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Returns"
        description="Requests raised from the customer's own order page."
      />

      <div className="mb-6 grid gap-6 sm:grid-cols-3">
        <StatCard label="Open requests" value={openCount} />
        <StatCard label="All time" value={returns.length} />
        <StatCard label="Refunded" value={refundedTotal} format={money} />
      </div>

      <div className="card-surface mb-6 p-6">
        <Select
          label="Status"
          className="max-w-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {RETURN_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        searchValue={(r) => `${r.order_number} ${r.email} ${r.reason}`}
        searchPlaceholder="Search by order number, email or reason…"
        emptyMessage="No return requests yet."
      />

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? `Return · ${open.order_number}` : "Return"}
        description={open?.email}
      >
        {open && (
          <div className="flex flex-col gap-6 p-6">
            <div>
              <span className="label-caps">Items</span>
              <ul className="mt-3 flex flex-col divide-y divide-hairline border-y border-hairline">
                {open.items.map((item) => (
                  <li
                    key={item.order_item_id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-body-sm text-ink">{item.title}</p>
                      {item.variant_info && item.variant_info.length > 0 && (
                        <p className="text-caption normal-case tracking-normal text-muted">
                          {item.variant_info.map((v) => v.value).join(" / ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-body-sm tabular-nums text-muted">
                      × {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-baseline justify-between rounded-sm bg-cream px-5 py-4">
              <span className="text-body-sm text-muted">Refund amount</span>
              <span className="font-serif text-xl text-ink">
                {money(open.refund_amount)}
              </span>
            </div>

            <div>
              <span className="label-caps">Reason</span>
              <p className="mt-2 text-body-sm text-ink">{open.reason}</p>
              {open.comment && (
                <p className="mt-2 whitespace-pre-wrap text-body-sm text-muted">
                  {open.comment}
                </p>
              )}
            </div>

            <Select
              label="Status"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value as ReturnStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {RETURN_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>

            <Textarea
              label="Note to the customer"
              rows={3}
              value={draftNote}
              hint="Shown on their order page."
              onChange={(e) => setDraftNote(e.target.value)}
            />

            <p className="text-caption normal-case tracking-normal text-muted">
              Marking a return refunded records it here and on the order
              timeline. Money is not moved — issue the refund in Razorpay.
            </p>

            <div className="flex flex-wrap justify-between gap-3">
              <Link
                href={`/admin/orders/${open.order_id}`}
                className="inline-flex h-12 items-center text-caption normal-case tracking-normal text-accent underline underline-offset-4"
              >
                Open the order
              </Link>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setOpen(null)}>
                  Cancel
                </Button>
                <Button onClick={save} loading={saving}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
