"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Column, DataTable, PageHeader } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Checkbox } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Category, Coupon, CouponType } from "@/types";

interface FormState {
  code: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  usageLimit: string;
  perCustomerLimit: string;
  validFrom: string;
  validTo: string;
  applicableProducts: string[];
  applicableCategories: string[];
  isActive: boolean;
}

const EMPTY: FormState = {
  code: "",
  type: "percentage",
  value: "",
  minOrderAmount: "0",
  usageLimit: "",
  perCustomerLimit: "",
  validFrom: "",
  validTo: "",
  applicableProducts: [],
  applicableCategories: [],
  isActive: true,
};

export function CouponsManager({
  coupons: initial,
  products,
  categories,
  currencySymbol,
  currencyCode,
}: {
  coupons: Coupon[];
  products: { id: string; title: string }[];
  categories: Category[];
  currencySymbol: string;
  currencyCode: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [coupons, setCoupons] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);

  const money = (n: number) => formatCurrency(n, currencySymbol, currencyCode);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrderAmount: String(coupon.min_order_amount),
      usageLimit: coupon.usage_limit != null ? String(coupon.usage_limit) : "",
      perCustomerLimit:
        coupon.per_customer_limit != null ? String(coupon.per_customer_limit) : "",
      validFrom: coupon.valid_from?.slice(0, 10) ?? "",
      validTo: coupon.valid_to?.slice(0, 10) ?? "",
      applicableProducts: coupon.applicable_products ?? [],
      applicableCategories: coupon.applicable_categories ?? [],
      isActive: coupon.is_active,
    });
    setErrors({});
    setFormOpen(true);
  }

  async function reload() {
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const next: Record<string, string> = {};
    if (!form.code.trim()) next.code = "Required.";

    const value = Number(form.value);
    if (!form.value.trim() || Number.isNaN(value) || value <= 0) {
      next.value = "Enter a value above zero.";
    } else if (form.type === "percentage" && value > 100) {
      next.value = "A percentage cannot exceed 100.";
    }

    if (form.validFrom && form.validTo && new Date(form.validFrom) > new Date(form.validTo)) {
      next.validTo = "The end date must be after the start date.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value,
        min_order_amount: Number(form.minOrderAmount) || 0,
        usage_limit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
        per_customer_limit: form.perCustomerLimit.trim()
          ? Number(form.perCustomerLimit)
          : null,
        valid_from: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        valid_to: form.validTo ? new Date(form.validTo).toISOString() : null,
        applicable_products: form.applicableProducts,
        applicable_categories: form.applicableCategories,
        is_active: form.isActive,
      };

      const { error } = editing
        ? await supabase.from("coupons").update(payload).eq("id", editing.id)
        : await supabase.from("coupons").insert(payload);

      if (error) {
        toast.error(
          "Couldn't save the coupon",
          error.code === "23505" ? "That code already exists." : error.message,
        );
        return;
      }

      await reload();
      setFormOpen(false);
      toast.success(editing ? "Coupon updated" : "Coupon created");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("coupons").delete().eq("id", deleting.id);

    if (error) {
      toast.error("Couldn't delete", error.message);
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== deleting.id));
    setDeleting(null);
    toast.success("Coupon deleted");
  }

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      sortValue: (c) => c.code,
      render: (c) => (
        <span className="font-medium uppercase tracking-[0.05em] text-ink">{c.code}</span>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      sortValue: (c) => Number(c.value),
      render: (c) => (
        <span className="text-ink">
          {c.type === "percentage" ? `${c.value}%` : money(Number(c.value))}
        </span>
      ),
    },
    {
      key: "min",
      header: "Min order",
      sortValue: (c) => Number(c.min_order_amount),
      render: (c) => (
        <span className="text-muted tabular-nums">
          {Number(c.min_order_amount) > 0 ? money(Number(c.min_order_amount)) : "—"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Used",
      sortValue: (c) => c.times_used,
      render: (c) => (
        <span className="text-muted tabular-nums">
          {c.times_used}
          {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Valid",
      sortValue: (c) => (c.valid_to ? new Date(c.valid_to).getTime() : Infinity),
      render: (c) => (
        <span className="text-muted">
          {c.valid_to ? `until ${formatDate(c.valid_to)}` : "No expiry"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (c) => String(c.is_active),
      render: (c) => (
        <Badge tone={c.is_active ? "success" : "neutral"}>
          {c.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (c) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openEdit(c)}
            aria-label={`Edit ${c.code}`}
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setDeleting(c)}
            aria-label={`Delete ${c.code}`}
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  const multiSelect =
    "h-40 w-full rounded-sm border border-ink/12 bg-white p-2 text-body-sm outline-none focus:border-accent";

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            New coupon
          </Button>
        }
      />

      <DataTable
        rows={coupons}
        columns={columns}
        rowKey={(c) => c.id}
        searchValue={(c) => c.code}
        searchPlaceholder="Search by code…"
        emptyMessage="No coupons yet."
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit coupon" : "New coupon"}
        size="lg"
      >
        <form onSubmit={save} className="flex flex-col gap-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Code"
              required
              value={form.code}
              error={errors.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </Select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={form.type === "percentage" ? "Percentage" : "Amount"}
              type="number"
              min="0"
              step="0.01"
              required
              value={form.value}
              error={errors.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
            <Input
              label="Minimum order amount"
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Total usage limit"
              type="number"
              min="1"
              step="1"
              value={form.usageLimit}
              hint="Leave blank for unlimited."
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            />
            <Input
              label="Per-customer limit"
              type="number"
              min="1"
              step="1"
              value={form.perCustomerLimit}
              hint="Leave blank for unlimited."
              onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Valid from"
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            />
            <Input
              label="Valid to"
              type="date"
              value={form.validTo}
              error={errors.validTo}
              onChange={(e) => setForm({ ...form, validTo: e.target.value })}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="applicable-categories"
                className="text-caption uppercase tracking-[0.1em] text-muted"
              >
                Applicable categories
              </label>
              <select
                id="applicable-categories"
                multiple
                value={form.applicableCategories}
                onChange={(e) =>
                  setForm({
                    ...form,
                    applicableCategories: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    ),
                  })
                }
                className={`mt-2 ${multiSelect}`}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="applicable-products"
                className="text-caption uppercase tracking-[0.1em] text-muted"
              >
                Applicable products
              </label>
              <select
                id="applicable-products"
                multiple
                value={form.applicableProducts}
                onChange={(e) =>
                  setForm({
                    ...form,
                    applicableProducts: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    ),
                  })
                }
                className={`mt-2 ${multiSelect}`}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-caption normal-case tracking-normal text-muted">
            Leave both lists empty to apply the discount across the whole cart.
          </p>

          <Checkbox
            label="Coupon is active"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />

          <div className="mt-3 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create coupon"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this coupon?"
        message={`"${deleting?.code}" will stop working immediately. Orders that already used it are unaffected.`}
      />
    </>
  );
}
