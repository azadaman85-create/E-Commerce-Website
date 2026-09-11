"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { cn, discountPercent, effectivePrice, isOnSale } from "@/lib/utils";
import { fadeUp, EASE_TACTILE } from "@/lib/motion";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/SettingsContext";
import { useToast } from "@/components/ui/Toast";
import { Stars } from "@/components/ui/Stars";
import type { ProductWithRelations } from "@/types";

interface ProductCardProps {
  product: ProductWithRelations;
  rating?: { average: number; count: number };
  priority?: boolean;
  onQuickView?: (product: ProductWithRelations) => void;
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
}

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjEwIj48cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YxZjFlZSIvPjwvc3ZnPg==";

/**
 * NEW is shown for products created in the last 30 days.
 */
function isNew(createdAt: string): boolean {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() < thirtyDays;
}

export function ProductCard({
  product,
  rating,
  priority = false,
  onQuickView,
  isSaved = false,
  onToggleSave,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const formatCurrency = useCurrency();
  const toast = useToast();

  const images = product.product_images ?? [];
  const primary = images[0]?.image_url ?? null;
  const secondary = images[1]?.image_url ?? null;
  const onSale = isOnSale(product);
  const price = effectivePrice(product);
  const outOfStock = product.track_inventory && product.stock_quantity <= 0;
  const hasVariants = (product.product_variants?.length ?? 0) > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Products with variants must be configured on the PDP or in quick view.
    if (hasVariants && onQuickView) {
      onQuickView(product);
      return;
    }

    if (outOfStock) return;

    addItem(
      {
        productId: product.id,
        variantId: null,
        slug: product.slug,
        title: product.title,
        imageUrl: primary,
        unitPrice: price,
        quantity: 1,
        maxQuantity: product.track_inventory ? product.stock_quantity : 99,
      },
      imageRef.current?.querySelector("img"),
    );
    toast.success("Added to cart", product.title);
  };

  return (
    <motion.article variants={fadeUp} className="group flex flex-col">
      <div
        className="relative overflow-hidden rounded-sm bg-cream"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link
          href={`/products/${product.slug}`}
          className="block"
          aria-label={product.title}
        >
          <div ref={imageRef} className="relative aspect-[3/4] w-full">
            {primary ? (
              <>
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: hovered ? 1.05 : 1 }}
                  transition={{ duration: 0.5, ease: EASE_TACTILE }}
                >
                  <Image
                    src={primary}
                    alt={images[0]?.alt_text ?? product.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                    priority={priority}
                    placeholder="blur"
                    blurDataURL={PLACEHOLDER}
                  />
                </motion.div>
                {/* Secondary lifestyle shot crossfades in on hover. */}
                {secondary && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.05 : 1 }}
                    transition={{ duration: 0.5, ease: EASE_TACTILE }}
                  >
                    <Image
                      src={secondary}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={PLACEHOLDER}
                    />
                  </motion.div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-caption uppercase tracking-[0.1em] text-muted">
                No image
              </div>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
          {isNew(product.created_at) && (
            <span className="animate-pulse-badge rounded-full bg-ink px-3 py-1 text-caption uppercase tracking-[0.1em] text-white">
              New
            </span>
          )}
          {onSale && (
            <span className="rounded-full bg-danger px-3 py-1 text-caption uppercase tracking-[0.1em] text-white">
              −{discountPercent(product.price, product.sale_price as number)}%
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-white px-3 py-1 text-caption uppercase tracking-[0.1em] text-muted">
              Sold out
            </span>
          )}
        </div>

        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(product.id);
            }}
            aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={isSaved}
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/90 p-2.5 backdrop-blur transition-colors hover:bg-white"
          >
            <motion.span
              key={String(isSaved)}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="block"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isSaved ? "text-danger" : "text-ink",
                )}
                fill={isSaved ? "currentColor" : "none"}
                strokeWidth={1.5}
                aria-hidden
              />
            </motion.span>
          </button>
        )}

        {/* Quick Add slides up from below the card on hover. */}
        <motion.div
          className="absolute inset-x-4 bottom-4 hidden md:block"
          initial={false}
          animate={hovered ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_TACTILE, delay: hovered ? 0.1 : 0 }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={outOfStock}
              className={cn(
                "flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-sm",
                "bg-white/95 text-caption uppercase tracking-[0.1em] text-ink backdrop-blur",
                "transition-colors hover:bg-ink hover:text-white",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white/95 disabled:hover:text-ink",
              )}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {outOfStock ? "Sold out" : hasVariants ? "Choose options" : "Quick add"}
            </button>
            {onQuickView && !hasVariants && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView(product);
                }}
                className="h-11 cursor-pointer rounded-sm bg-white/95 px-4 text-caption uppercase tracking-[0.1em] text-ink backdrop-blur transition-colors hover:bg-ink hover:text-white"
              >
                View
              </button>
            )}
          </div>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        {product.categories?.name && (
          <span className="label-caps">{product.categories.name}</span>
        )}
        <h3 className="font-serif text-product-title leading-tight text-ink">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-accent"
          >
            {product.title}
          </Link>
        </h3>

        {rating && rating.count > 0 && (
          <div className="flex items-center gap-2">
            <Stars rating={rating.average} size={13} />
            <span className="text-caption normal-case tracking-normal text-muted">
              ({rating.count})
            </span>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span
            className={cn(
              "text-body-sm font-medium",
              onSale ? "text-danger" : "text-ink",
            )}
          >
            {formatCurrency(price)}
          </span>
          {onSale && (
            <span className="text-caption normal-case tracking-normal text-muted line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
