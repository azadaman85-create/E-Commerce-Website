"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Minus, Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/SettingsContext";
import { useToast } from "@/components/ui/Toast";
import { useWishlist } from "@/hooks";
import { cn, discountPercent, effectivePrice, isOnSale } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type { ProductWithRelations, VariantOptionValue } from "@/types";

/** Maps common colour names to swatch fills. Falls back to a neutral chip. */
const SWATCHES: Record<string, string> = {
  ecru: "#EDE7DA",
  charcoal: "#3A3A3A",
  navy: "#1F2A44",
  black: "#1A1A1A",
  white: "#FFFFFF",
  chestnut: "#8B5A2B",
  olive: "#6B7355",
  grey: "#9CA3AF",
  gray: "#9CA3AF",
};

function isColourOption(name: string) {
  const lower = name.toLowerCase();
  return lower === "colour" || lower === "color";
}

interface Props {
  product: ProductWithRelations;
  rating: { average: number; count: number };
  galleryImageSelector?: string;
}

export function ProductPurchasePanel({ product, rating }: Props) {
  const { addItem, openCart } = useCart();
  const formatCurrency = useCurrency();
  const toast = useToast();
  const wishlist = useWishlist();

  const options = useMemo(() => product.product_options ?? [], [product]);
  const variants = useMemo(() => product.product_variants ?? [], [product]);

  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const matchedVariant = useMemo(() => {
    if (options.length === 0) return null;
    if (Object.keys(selection).length !== options.length) return null;
    return (
      variants.find((variant) =>
        variant.option_values.every((ov) => selection[ov.option_name] === ov.value),
      ) ?? null
    );
  }, [options.length, selection, variants]);

  const onSale = isOnSale(product);
  const basePrice = effectivePrice(product);
  const price = matchedVariant?.price != null ? Number(matchedVariant.price) : basePrice;

  const requiresSelection = options.length > 0;
  const stock = matchedVariant
    ? matchedVariant.stock_quantity
    : product.track_inventory
      ? product.stock_quantity
      : 99;

  const maxQuantity = Math.max(1, product.allow_backorders ? 99 : stock);
  const soldOut = !product.allow_backorders && stock <= 0;
  const canAdd = requiresSelection ? Boolean(matchedVariant) && !soldOut : !soldOut;

  const handleAdd = () => {
    if (!canAdd) return;

    const variantInfo: VariantOptionValue[] = matchedVariant?.option_values ?? [];
    const sourceImage = document.querySelector<HTMLImageElement>(
      "[data-pdp-gallery] img",
    );

    addItem(
      {
        productId: product.id,
        variantId: matchedVariant?.id ?? null,
        slug: product.slug,
        title: product.title,
        imageUrl: product.product_images?.[0]?.image_url ?? null,
        unitPrice: price,
        quantity,
        maxQuantity,
        variantInfo,
      },
      sourceImage,
    );

    toast.success("Added to cart", `${product.title} × ${quantity}`);
  };

  const handleSave = async () => {
    try {
      const result = await wishlist.toggle(product.id);
      if (result === "unauthenticated") {
        toast.info("Sign in to save items", "Your wishlist syncs across devices.");
        return;
      }
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
    } catch {
      toast.error("Couldn't update your wishlist", "Please try again.");
    }
  };

  const isSaved = wishlist.isSaved(product.id);

  return (
    <div className="flex flex-col">
      {product.categories?.name && (
        <span className="label-caps">{product.categories.name}</span>
      )}

      <h1 className="mt-3 font-serif text-4xl leading-tight text-ink md:text-5xl">
        {product.title}
      </h1>

      {rating.count > 0 && (
        <a href="#reviews" className="mt-4 flex w-fit items-center gap-2 hover:underline">
          <Stars rating={rating.average} size={15} />
          <span className="text-caption normal-case tracking-normal text-muted">
            {rating.average.toFixed(1)} · {rating.count} review
            {rating.count === 1 ? "" : "s"}
          </span>
        </a>
      )}

      <div className="mt-6 flex items-baseline gap-3">
        <span
          className={cn("text-2xl font-medium", onSale ? "text-danger" : "text-ink")}
        >
          {formatCurrency(price)}
        </span>
        {onSale && (
          <>
            <span className="text-body text-muted line-through">
              {formatCurrency(product.price)}
            </span>
            <span className="rounded-full bg-danger/10 px-2.5 py-1 text-caption uppercase tracking-[0.1em] text-danger">
              Save {discountPercent(product.price, product.sale_price as number)}%
            </span>
          </>
        )}
      </div>

      {product.short_description && (
        <p className="mt-6 max-w-prose text-body leading-relaxed text-muted">
          {product.short_description}
        </p>
      )}

      {product.sku && (
        <p className="mt-4 text-caption normal-case tracking-normal text-muted">
          SKU: {matchedVariant?.sku ?? product.sku}
        </p>
      )}

      {options.map((option) => {
        const colourOption = isColourOption(option.name);

        return (
          <div key={option.id} className="mt-8">
            <div className="flex items-baseline justify-between">
              <span className="label-caps">{option.name}</span>
              {selection[option.name] && (
                <span className="text-caption normal-case tracking-normal text-ink">
                  {selection[option.name]}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(option.product_option_values ?? []).map((value) => {
                const isSelected = selection[option.name] === value.value;

                const available = variants.some((variant) => {
                  const carries = variant.option_values.some(
                    (ov) => ov.option_name === option.name && ov.value === value.value,
                  );
                  if (!carries) return false;
                  const consistent = Object.entries(selection).every(
                    ([name, picked]) =>
                      name === option.name ||
                      variant.option_values.some(
                        (ov) => ov.option_name === name && ov.value === picked,
                      ),
                  );
                  return consistent && variant.stock_quantity > 0;
                });

                if (colourOption) {
                  const fill = SWATCHES[value.value.toLowerCase()] ?? "#D6D3CB";
                  return (
                    <button
                      key={value.id}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setSelection((prev) => ({ ...prev, [option.name]: value.value }));
                        setQuantity(1);
                      }}
                      aria-label={`${option.name}: ${value.value}${available ? "" : " (unavailable)"}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200",
                        isSelected ? "border-ink" : "border-ink/12 hover:border-ink/40",
                        !available && "cursor-not-allowed opacity-35",
                      )}
                    >
                      <span
                        className="h-7 w-7 rounded-full border border-black/8"
                        style={{ backgroundColor: fill }}
                      />
                      <AnimatePresence>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                ["#FFFFFF", "#EDE7DA"].includes(fill)
                                  ? "text-ink"
                                  : "text-white",
                              )}
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                }

                return (
                  <button
                    key={value.id}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSelection((prev) => ({ ...prev, [option.name]: value.value }));
                      setQuantity(1);
                    }}
                    aria-pressed={isSelected}
                    className={cn(
                      "min-w-14 cursor-pointer rounded-sm border px-4 py-3 text-body-sm transition-all duration-200",
                      isSelected
                        ? "border-ink bg-ink text-white"
                        : "border-ink/15 text-ink hover:border-ink/50",
                      !available &&
                        "cursor-not-allowed border-ink/8 text-ink/25 line-through hover:border-ink/8",
                    )}
                  >
                    {value.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-8">
        <span className="label-caps">Quantity</span>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center rounded-sm border border-ink/15">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-12 w-12 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span className="w-12 text-center text-body tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Increase quantity"
              className="flex h-12 w-12 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {product.track_inventory && stock > 0 && stock <= 10 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-caption normal-case tracking-normal text-danger"
            >
              Only {stock} left
            </motion.span>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button
          onClick={handleAdd}
          disabled={!canAdd}
          size="lg"
          className="flex-1"
        >
          {soldOut
            ? "Out of stock"
            : requiresSelection && !matchedVariant
              ? `Select ${options.map((o) => o.name.toLowerCase()).join(" and ")}`
              : "Add to cart"}
        </Button>

        <motion.button
          type="button"
          onClick={handleSave}
          whileTap={{ scale: 0.94 }}
          aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={isSaved}
          className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-ink/15 transition-colors hover:border-ink/45"
        >
          <motion.span
            key={String(isSaved)}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 14 }}
          >
            <Heart
              className={cn("h-5 w-5", isSaved ? "text-danger" : "text-ink")}
              fill={isSaved ? "currentColor" : "none"}
              strokeWidth={1.5}
              aria-hidden
            />
          </motion.span>
        </motion.button>
      </div>

      {!soldOut && (
        <button
          type="button"
          onClick={() => {
            handleAdd();
            openCart();
          }}
          disabled={!canAdd}
          className="mt-3 h-14 cursor-pointer rounded-sm border border-ink bg-ink text-label uppercase tracking-[0.1em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Buy it now
        </button>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: EASE_TACTILE }}
        className="mt-8 flex items-center gap-3 rounded-sm bg-cream px-5 py-4 text-body-sm text-muted"
      >
        <Truck className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
        Free shipping on orders over ₹2,000 · 30-day returns
      </motion.div>
    </div>
  );
}
