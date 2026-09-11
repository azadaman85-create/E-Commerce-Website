"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { staggerGrid, inViewOnce } from "@/lib/motion";
import { ProductCard } from "@/components/storefront/ProductCard";

// Quick view is only reachable from a hover action, so it does not belong in
// the initial bundle of every page that renders a product grid.
const QuickViewModal = dynamic(
  () =>
    import("@/components/storefront/QuickViewModal").then((m) => m.QuickViewModal),
  { ssr: false },
);
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";

interface ProductGridProps {
  products: ProductWithRelations[];
  ratings?: Record<string, { average: number; count: number }>;
  columns?: 2 | 3 | 4;
  priorityCount?: number;
  className?: string;
  enableQuickView?: boolean;
}

export function ProductGrid({
  products,
  ratings = {},
  columns = 4,
  priorityCount = 4,
  className,
  enableQuickView = true,
}: ProductGridProps) {
  const [quickView, setQuickView] = useState<ProductWithRelations | null>(null);
  const wishlist = useWishlist();
  const toast = useToast();

  const handleToggleSave = async (productId: string) => {
    try {
      const result = await wishlist.toggle(productId);
      if (result === "unauthenticated") {
        toast.info("Sign in to save items", "Your wishlist syncs across devices.");
        return;
      }
      toast.success(
        result === "added" ? "Saved to wishlist" : "Removed from wishlist",
      );
    } catch {
      toast.error("Couldn't update your wishlist", "Please try again.");
    }
  };

  const columnClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <>
      <motion.div
        {...inViewOnce}
        variants={staggerGrid}
        className={cn("grid gap-6", columnClass, className)}
      >
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            rating={ratings[product.id]}
            priority={i < priorityCount}
            onQuickView={enableQuickView ? setQuickView : undefined}
            isSaved={wishlist.isSaved(product.id)}
            onToggleSave={handleToggleSave}
          />
        ))}
      </motion.div>

      {enableQuickView && (
        <QuickViewModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </>
  );
}
