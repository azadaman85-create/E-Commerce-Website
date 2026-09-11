"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Badge, FulfillmentBadge, PaymentBadge } from "@/components/ui/Badge";
import { PageHeader, StatCard } from "@/components/admin/AdminUI";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, round2 } from "@/lib/utils";
import type { Address, OrderWithItems, Profile } from "@/types";

export function CustomerDetail({
  profile,
  orders,
  addresses,
  currencySymbol,
  currencyCode,
}: {
  profile: Profile;
  orders: OrderWithItems[];
  addresses: Address[];
  currencySymbol: string;
  currencyCode: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [notes, setNotes] = useState(profile.notes ?? "");
  const [saving, setSaving] = useState(false);

  const money = (n: number) => formatCurrency(n, currencySymbol, currencyCode);

  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const lifetimeValue = round2(
    paidOrders.reduce((sum, o) => sum + Number(o.total), 0),
  );
  const avgOrder = paidOrders.length ? round2(lifetimeValue / paidOrders.length) : 0;

  async function saveNotes() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ notes: notes.trim() || null })
        .eq("id", profile.id);

      if (error) {
        toast.error("Couldn't save the note", error.message);
        return;
      }
      toast.success("Internal note saved");
    } finally {
      setSaving(false);
    }
  }

  const card = "card-surface p-6";

  return (
    <>
      <PageHeader
        title={profile.full_name ?? profile.email}
        description={`Customer since ${formatDate(profile.created_at)}`}
        action={<Badge tone={profile.role === "admin" ? "accent" : "neutral"}>{profile.role}</Badge>}
      />

      <div className="mb-6 grid gap-6 sm:grid-cols-3">
        <StatCard label="Lifetime value" value={lifetimeValue} format={money} />
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Avg order value" value={avgOrder} format={money} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className="card-surface overflow-hidden">
            <div className="border-b border-hairline px-6 py-4">
              <h2 className="text-label uppercase tracking-[0.1em] text-ink">
                Order history
              </h2>
            </div>

            {orders.length === 0 ? (
              <p className="py-16 text-center text-body-sm text-muted">
                This customer has not placed an order yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-hairline bg-cream/50">
                      {["Order", "Date", "Items", "Payment", "Fulfillment", "Total"].map(
                        (header) => (
                          <th
                            key={header}
                            scope="col"
                            className="px-6 py-3 text-caption uppercase tracking-[0.1em] text-muted"
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-hairline last:border-0 hover:bg-cream/40"
                      >
                        <td className="px-6 py-3 text-body-sm">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-ink transition-colors hover:text-accent"
                          >
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-body-sm text-muted">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-3 text-body-sm tabular-nums text-muted">
                          {order.order_items.reduce((sum, i) => sum + i.quantity, 0)}
                        </td>
                        <td className="px-6 py-3">
                          <PaymentBadge status={order.payment_status} />
                        </td>
                        <td className="px-6 py-3">
                          <FulfillmentBadge status={order.fulfillment_status} />
                        </td>
                        <td className="px-6 py-3 text-body-sm tabular-nums text-ink">
                          {money(Number(order.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className={card}>
            <h2 className="mb-5 text-label uppercase tracking-[0.1em] text-ink">
              Contact
            </h2>
            <dl className="flex flex-col gap-3 text-body-sm">
              <div>
                <dt className="text-caption uppercase tracking-[0.1em] text-muted">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${profile.email}`}
                    className="break-all text-accent underline underline-offset-4"
                  >
                    {profile.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-caption uppercase tracking-[0.1em] text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-ink">{profile.phone ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className={card}>
            <h2 className="mb-5 text-label uppercase tracking-[0.1em] text-ink">
              Addresses
            </h2>
            {addresses.length === 0 ? (
              <p className="text-body-sm text-muted">No saved addresses.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {addresses.map((address) => (
                  <li key={address.id} className="text-body-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink">{address.full_name}</span>
                      {address.is_default && <Badge tone="accent">Default</Badge>}
                    </div>
                    <address className="mt-2 not-italic leading-relaxed text-muted">
                      {address.address_line1}
                      <br />
                      {address.city}, {address.state} {address.zip}
                      <br />
                      {address.country}
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={card}>
            <h2 className="mb-5 text-label uppercase tracking-[0.1em] text-ink">
              Internal notes
            </h2>
            <Textarea
              label="Notes"
              rows={5}
              value={notes}
              hint="Only visible to admins."
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="mt-4">
              <Button onClick={saveNotes} loading={saving} variant="secondary" fullWidth>
                Save note
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
