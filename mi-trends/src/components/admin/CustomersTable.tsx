"use client";

import { Column, DataTable, PageHeader } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import type { CustomerRow } from "@/app/(admin)/admin/customers/page";

export function CustomersTable({
  customers,
  currencySymbol,
  currencyCode,
}: {
  customers: CustomerRow[];
  currencySymbol: string;
  currencyCode: string;
}) {
  const money = (n: number) => formatCurrency(n, currencySymbol, currencyCode);

  const columns: Column<CustomerRow>[] = [
    {
      key: "name",
      header: "Customer",
      sortValue: (c) => c.full_name ?? c.email,
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-caption font-medium normal-case tracking-normal text-ink">
            {initials(c.full_name ?? c.email)}
          </span>
          <div className="min-w-0">
            <span className="block truncate font-medium text-ink">
              {c.full_name ?? "—"}
            </span>
            <span className="block truncate text-caption normal-case tracking-normal text-muted">
              {c.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      sortValue: (c) => c.orderCount,
      render: (c) => <span className="tabular-nums text-ink">{c.orderCount}</span>,
    },
    {
      key: "spent",
      header: "Total spent",
      sortValue: (c) => c.totalSpent,
      render: (c) => (
        <span className="font-medium tabular-nums text-ink">{money(c.totalSpent)}</span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      sortValue: (c) => new Date(c.created_at).getTime(),
      render: (c) => <span className="text-muted">{formatDate(c.created_at)}</span>,
    },
    {
      key: "role",
      header: "Role",
      sortValue: (c) => c.role,
      render: (c) => (
        <Badge tone={c.role === "admin" ? "accent" : "neutral"}>{c.role}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${customers.length} registered customer${customers.length === 1 ? "" : "s"}.`}
      />

      <DataTable
        rows={customers}
        columns={columns}
        rowKey={(c) => c.id}
        rowHref={(c) => `/admin/customers/${c.id}`}
        searchValue={(c) => `${c.full_name ?? ""} ${c.email} ${c.phone ?? ""}`}
        searchPlaceholder="Search by name, email or phone…"
        emptyMessage="No customers yet."
      />
    </>
  );
}
