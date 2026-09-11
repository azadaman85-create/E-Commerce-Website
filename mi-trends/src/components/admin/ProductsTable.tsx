"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Column, DataTable, PageHeader } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, isOnSale } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

export function ProductsTable({
  products: initial,
  currencySymbol,
  currencyCode,
}: {
  products: ProductWithRelations[];
  currencySymbol: string;
  currencyCode: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState(initial);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<ProductWithRelations | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [working, setWorking] = useState(false);

  const money = (n: number) => formatCurrency(Number(n), currencySymbol, currencyCode);

  async function deleteOne() {
    if (!deleting) return;
    setWorking(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", deleting.id);
      if (error) {
        toast.error("Couldn't delete", error.message);
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      toast.success("Product deleted");
    } finally {
      setWorking(false);
    }
  }

  async function deleteSelected() {
    setWorking(true);
    try {
      const { error } = await supabase.from("products").delete().in("id", selected);
      if (error) {
        toast.error("Couldn't delete", error.message);
        return;
      }
      setProducts((prev) => prev.filter((p) => !selected.includes(p.id)));
      toast.success(`${selected.length} product(s) deleted`);
      setSelected([]);
      setBulkDeleting(false);
    } finally {
      setWorking(false);
    }
  }

  async function setStatus(status: "active" | "draft") {
    const { error } = await supabase
      .from("products")
      .update({ status })
      .in("id", selected);

    if (error) {
      toast.error("Couldn't update status", error.message);
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (selected.includes(p.id) ? { ...p, status } : p)),
    );
    toast.success(`${selected.length} product(s) set to ${status}`);
    setSelected([]);
    router.refresh();
  }

  const columns: Column<ProductWithRelations>[] = [
    {
      key: "title",
      header: "Product",
      sortValue: (p) => p.title,
      render: (p) => {
        const image = [...(p.product_images ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        )[0];
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-sm bg-cream">
              {image && (
                <Image
                  src={image.image_url}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              )}
            </div>
            <span className="min-w-0 truncate font-medium text-ink">{p.title}</span>
          </div>
        );
      },
    },
    {
      key: "sku",
      header: "SKU",
      sortValue: (p) => p.sku ?? "",
      render: (p) => <span className="text-muted">{p.sku ?? "—"}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortValue: (p) => p.categories?.name ?? "",
      render: (p) => <span className="text-muted">{p.categories?.name ?? "—"}</span>,
    },
    {
      key: "price",
      header: "Price",
      sortValue: (p) => Number(p.price),
      render: (p) => (
        <span className="tabular-nums text-ink">
          {isOnSale(p) ? (
            <>
              <span className="text-danger">{money(p.sale_price as number)}</span>{" "}
              <span className="text-muted line-through">{money(p.price)}</span>
            </>
          ) : (
            money(p.price)
          )}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      sortValue: (p) => p.stock_quantity,
      render: (p) => (
        <span
          className={
            !p.track_inventory
              ? "text-muted"
              : p.stock_quantity === 0
                ? "font-medium text-danger"
                : p.stock_quantity < 10
                  ? "font-medium text-[#B45309]"
                  : "text-ink"
          }
        >
          {p.track_inventory ? p.stock_quantity : "∞"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (p) => p.status,
      render: (p) => (
        <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (p) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/products/${p.id}`}
            aria-label={`Edit ${p.title}`}
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setDeleting(p)}
            aria-label={`Delete ${p.title}`}
            className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"} in the catalogue.`}
        action={
          <ButtonLink href="/admin/products/new">
            <Plus className="h-4 w-4" aria-hidden />
            New product
          </ButtonLink>
        }
      />

      <DataTable
        rows={products}
        columns={columns}
        rowKey={(p) => p.id}
        rowHref={(p) => `/admin/products/${p.id}`}
        searchValue={(p) => `${p.title} ${p.sku ?? ""} ${p.categories?.name ?? ""}`}
        searchPlaceholder="Search by name, SKU or category…"
        emptyMessage="No products yet — create your first one."
        selectable
        selected={selected}
        onSelectedChange={setSelected}
        toolbar={
          selected.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption normal-case tracking-normal text-muted">
                {selected.length} selected
              </span>
              <Button size="sm" variant="secondary" onClick={() => setStatus("active")}>
                Publish
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStatus("draft")}>
                Draft
              </Button>
              <Button size="sm" variant="danger" onClick={() => setBulkDeleting(true)}>
                Delete
              </Button>
            </div>
          ) : null
        }
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={deleteOne}
        loading={working}
        title="Delete this product?"
        message={`"${deleting?.title}" and its images, options and variants will be permanently removed. Existing orders keep their own record of it.`}
      />

      <ConfirmDialog
        open={bulkDeleting}
        onClose={() => setBulkDeleting(false)}
        onConfirm={deleteSelected}
        loading={working}
        title={`Delete ${selected.length} product(s)?`}
        message="This cannot be undone. Existing orders keep their own record of these items."
      />
    </>
  );
}
