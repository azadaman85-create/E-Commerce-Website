"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Trash2 } from "lucide-react";
import { Column, DataTable, PageHeader, StatCard } from "@/components/admin/AdminUI";
import { Stars } from "@/components/ui/Stars";
import { Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate, truncate } from "@/lib/utils";
import type { Review } from "@/types";

export interface AdminReview extends Review {
  products: { title: string; slug: string } | null;
}

export function ReviewsManager({ reviews: initial }: { reviews: AdminReview[] }) {
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const [reviews, setReviews] = useState(initial);
  const [ratingFilter, setRatingFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminReview | null>(null);
  const [working, setWorking] = useState(false);

  const filtered = useMemo(
    () =>
      reviews.filter((r) => {
        if (ratingFilter && r.rating !== Number(ratingFilter)) return false;
        if (verifiedFilter === "verified" && !r.is_verified) return false;
        if (verifiedFilter === "unverified" && r.is_verified) return false;
        return true;
      }),
    [reviews, ratingFilter, verifiedFilter],
  );

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const lowRatings = reviews.filter((r) => r.rating <= 2).length;

  async function confirmDelete() {
    if (!pendingDelete) return;
    setWorking(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", pendingDelete.id);

      if (error) {
        toast.error("Couldn't delete", error.message);
        return;
      }
      setReviews((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Review deleted");
    } finally {
      setWorking(false);
    }
  }

  const columns: Column<AdminReview>[] = [
    {
      key: "product",
      header: "Product",
      sortValue: (r) => r.products?.title ?? "",
      render: (r) =>
        r.products ? (
          <Link
            href={`/products/${r.products.slug}`}
            target="_blank"
            className="text-ink transition-colors hover:text-accent"
          >
            {r.products.title}
          </Link>
        ) : (
          <span className="text-muted">(deleted product)</span>
        ),
    },
    {
      key: "rating",
      header: "Rating",
      sortValue: (r) => r.rating,
      render: (r) => <Stars rating={r.rating} size={13} />,
    },
    {
      key: "review",
      header: "Review",
      sortValue: (r) => r.title ?? "",
      render: (r) => (
        <div className="min-w-0 max-w-md">
          {r.title && (
            <span className="block truncate font-medium text-ink">{r.title}</span>
          )}
          {r.body && (
            <span className="block text-caption normal-case tracking-normal text-muted">
              {truncate(r.body, 90)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      sortValue: (r) => r.author_name ?? "",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-muted">{r.author_name ?? "Anonymous"}</span>
          {r.is_verified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Posted",
      sortValue: (r) => new Date(r.created_at).getTime(),
      render: (r) => <span className="text-muted">{formatDate(r.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (r) => (
        <button
          type="button"
          onClick={() => setPendingDelete(r)}
          aria-label="Delete review"
          className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Every customer review, newest first. Reviews can only be removed, not edited — the words stay the customer's."
      />

      <div className="mb-6 grid gap-6 sm:grid-cols-3">
        <StatCard label="Total reviews" value={reviews.length} />
        <StatCard
          label="Average rating"
          value={average}
          format={(n) => n.toFixed(2)}
        />
        <StatCard label="1–2 star" value={lowRatings} />
      </div>

      <div className="card-surface mb-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Rating"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </Select>

          <Select
            label="Purchase status"
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
          >
            <option value="">All reviews</option>
            <option value="verified">Verified buyers only</option>
            <option value="unverified">Unverified only</option>
          </Select>
        </div>

        {(ratingFilter || verifiedFilter) && (
          <button
            type="button"
            onClick={() => {
              setRatingFilter("");
              setVerifiedFilter("");
            }}
            className="mt-5 cursor-pointer text-caption normal-case tracking-normal text-accent underline underline-offset-4"
          >
            Clear filters
          </button>
        )}
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        searchValue={(r) =>
          `${r.products?.title ?? ""} ${r.title ?? ""} ${r.body ?? ""} ${r.author_name ?? ""}`
        }
        searchPlaceholder="Search reviews…"
        emptyMessage="No reviews match these filters."
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        loading={working}
        title="Delete this review?"
        message={`The ${pendingDelete?.rating}-star review${
          pendingDelete?.products ? ` of "${pendingDelete.products.title}"` : ""
        } will be removed permanently. The product's average rating will recalculate.`}
      />
    </>
  );
}
