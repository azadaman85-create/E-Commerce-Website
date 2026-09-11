"use client";

import { ProductGrid } from "@/components/storefront/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import type { ProductWithRelations } from "@/types";

export function WishlistGrid({
  products,
  ratings,
}: {
  products: ProductWithRelations[];
  ratings: Record<string, { average: number; count: number }>;
}) {
  if (products.length === 0) {
    return (
      <div className="card-surface">
        <EmptyState
          illustration="wishlist"
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it for later."
          action={
            <ButtonLink href="/products" variant="dark">
              Browse products
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-8 font-serif text-2xl text-ink">
        Saved items ({products.length})
      </h2>
      <ProductGrid products={products} ratings={ratings} columns={3} />
    </div>
  );
}
