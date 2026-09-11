"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/SettingsContext";
import { useToast } from "@/components/ui/Toast";
import { cn, effectivePrice, isOnSale, stripHtml, truncate } from "@/lib/utils";
import type { ProductWithRelations, VariantOptionValue } from "@/types";

interface QuickViewModalProps {
  product: ProductWithRelations | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const formatCurrency = useCurrency();
  const toast = useToast();
  const imageRef = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<Record<string, string>>({});

  // Reset the variant selection whenever a different product is opened.
  useEffect(() => {
    setSelection({});
  }, [product?.id]);

  // Memoised so they are stable identities for the useMemo below.
  const options = useMemo(() => product?.product_options ?? [], [product]);
  const variants = useMemo(() => product?.product_variants ?? [], [product]);

  const matchedVariant = useMemo(() => {
    if (options.length === 0) return null;
    if (Object.keys(selection).length !== options.length) return null;

    return (
      variants.find((variant) =>
        variant.option_values.every((ov) => selection[ov.option_name] === ov.value),
      ) ?? null
    );
  }, [options.length, selection, variants]);

  if (!product) return null;

  const images = product.product_images ?? [];
  const primary = images[0]?.image_url ?? null;
  const onSale = isOnSale(product);
  const basePrice = effectivePrice(product);
  const price = matchedVariant?.price != null ? Number(matchedVariant.price) : basePrice;

  const requiresSelection = options.length > 0;
  const stock = matchedVariant
    ? matchedVariant.stock_quantity
    : product.track_inventory
      ? product.stock_quantity
      : 99;
  const canAdd = requiresSelection ? Boolean(matchedVariant) && stock > 0 : stock > 0;

  const handleAdd = () => {
    if (!canAdd) return;

    const variantInfo: VariantOptionValue[] = matchedVariant
      ? matchedVariant.option_values
      : [];

    addItem(
      {
        productId: product.id,
        variantId: matchedVariant?.id ?? null,
        slug: product.slug,
        title: product.title,
        imageUrl: primary,
        unitPrice: price,
        quantity: 1,
        maxQuantity: Math.max(1, stock),
        variantInfo,
      },
      imageRef.current?.querySelector("img"),
    );

    toast.success("Added to cart", product.title);
    onClose();
  };

  const summary =
    product.short_description ??
    (product.description ? truncate(stripHtml(product.description), 180) : null);

  return (
    <Modal open={Boolean(product)} onClose={onClose} size="lg">
      <div className="grid md:grid-cols-2">
        <div ref={imageRef} className="relative aspect-[4/5] bg-cream md:aspect-auto md:min-h-[460px]">
          {primary && (
            <Image
              src={primary}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>

        <div className="flex flex-col p-8">
          {product.categories?.name && (
            <span className="label-caps">{product.categories.name}</span>
          )}

          <h2 className="mt-3 font-serif text-3xl leading-tight text-ink">
            {product.title}
          </h2>

          <div className="mt-4 flex items-baseline gap-3">
            <span
              className={cn(
                "text-xl font-medium",
                onSale ? "text-danger" : "text-ink",
              )}
            >
              {formatCurrency(price)}
            </span>
            {onSale && (
              <span className="text-body-sm text-muted line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {summary && (
            <p className="mt-6 text-body-sm leading-relaxed text-muted">{summary}</p>
          )}

          {options.map((option) => (
            <div key={option.id} className="mt-8">
              <div className="flex items-baseline justify-between">
                <span className="label-caps">{option.name}</span>
                {selection[option.name] && (
                  <span className="text-caption normal-case tracking-normal text-muted">
                    {selection[option.name]}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(option.product_option_values ?? []).map((value) => {
                  const isSelected = selection[option.name] === value.value;

                  // A value is unavailable when every variant carrying it,
                  // consistent with the other current selections, is out of stock.
                  const available = variants.some((variant) => {
                    const carriesValue = variant.option_values.some(
                      (ov) => ov.option_name === option.name && ov.value === value.value,
                    );
                    if (!carriesValue) return false;
                    const consistent = Object.entries(selection).every(
                      ([name, picked]) =>
                        name === option.name ||
                        variant.option_values.some(
                          (ov) => ov.option_name === name && ov.value === picked,
                        ),
                    );
                    return consistent && variant.stock_quantity > 0;
                  });

                  return (
                    <button
                      key={value.id}
                      type="button"
                      disabled={!available}
                      onClick={() =>
                        setSelection((prev) => ({ ...prev, [option.name]: value.value }))
                      }
                      className={cn(
                        "min-w-12 cursor-pointer rounded-sm border px-4 py-2.5 text-body-sm transition-all duration-200",
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
          ))}

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button onClick={handleAdd} disabled={!canAdd} fullWidth size="lg">
              {stock <= 0 && (!requiresSelection || matchedVariant)
                ? "Out of stock"
                : requiresSelection && !matchedVariant
                  ? `Select ${options.map((o) => o.name.toLowerCase()).join(" and ")}`
                  : "Add to cart"}
            </Button>

            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="text-center text-caption uppercase tracking-[0.1em] text-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
