"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CouponField } from "@/components/storefront/CouponField";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/SettingsContext";
import { computeTotals } from "@/lib/pricing";
import { EASE_TACTILE, staggerList } from "@/lib/motion";
import type { AppliedCoupon, ShippingMethod, SiteSettings } from "@/types";

interface Props {
  shippingMethods: ShippingMethod[];
  settings: SiteSettings;
}

export function CartPageClient({ shippingMethods, settings }: Props) {
  const { items, updateQuantity, removeItem, hydrated } = useCart();
  const formatCurrency = useCurrency();
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  // The cart page estimates with the cheapest method; checkout is where the
  // customer actually picks one.
  const estimatedMethod = useMemo(
    () =>
      [...shippingMethods].sort((a, b) => Number(a.price) - Number(b.price))[0] ?? null,
    [shippingMethods],
  );

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        coupon,
        shippingMethod: estimatedMethod,
        taxRate: Number(settings.tax_rate),
        taxInclusive: settings.tax_inclusive,
      }),
    [items, coupon, estimatedMethod, settings],
  );

  if (!hydrated) {
    return (
      <div className="container-page py-16">
        <Skeleton className="mb-12 h-10 w-48" />
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-6">
                <Skeleton className="h-40 w-32 shrink-0" />
                <div className="flex-1">
                  <Skeleton className="mb-3 h-5 w-1/2" />
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          illustration="cart"
          title="Your cart is empty"
          description="Once you add something, it will show up here."
          action={
            <ButtonLink href="/products" variant="dark" size="lg">
              Continue shopping
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-12">
        <span className="label-caps">Your bag</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          Shopping cart
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        <motion.ul
          variants={staggerList}
          initial="hidden"
          animate="visible"
          className="flex flex-col divide-y divide-hairline border-y border-hairline"
        >
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.key}
                layout
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                exit={{ opacity: 0, height: 0, x: 50 }}
                transition={{ duration: 0.3, ease: EASE_TACTILE }}
                className="flex gap-6 overflow-hidden py-8"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-sm bg-cream md:w-36"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-serif text-xl leading-snug text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      {item.variantInfo.length > 0 && (
                        <p className="mt-2 text-caption normal-case tracking-normal text-muted">
                          {item.variantInfo
                            .map((v) => `${v.option_name}: ${v.value}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>

                    <span className="shrink-0 text-body font-medium text-ink">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <div className="flex items-center rounded-sm border border-hairline">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.title}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="w-10 text-center text-body-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        aria-label={`Increase quantity of ${item.title}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-caption normal-case tracking-normal text-muted transition-colors hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Remove
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface p-8">
            <h2 className="text-label uppercase tracking-[0.1em] text-ink">
              Order summary
            </h2>

            <div className="mt-8">
              <CouponField items={items} applied={coupon} onApply={setCoupon} />
            </div>

            <dl className="mt-8 flex flex-col gap-4 border-t border-hairline pt-8 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink tabular-nums">
                  {formatCurrency(totals.subtotal)}
                </dd>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="text-success tabular-nums">
                    −{formatCurrency(totals.discount)}
                  </dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-muted">
                  Estimated shipping
                  {estimatedMethod && (
                    <span className="block text-caption normal-case tracking-normal text-muted/70">
                      {estimatedMethod.name}
                    </span>
                  )}
                </dt>
                <dd className="text-ink tabular-nums">
                  {totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping)}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-muted">
                  Tax ({settings.tax_rate}%
                  {settings.tax_inclusive ? ", included" : ""})
                </dt>
                <dd className="text-ink tabular-nums">{formatCurrency(totals.tax)}</dd>
              </div>

              <div className="mt-2 flex items-baseline justify-between border-t border-hairline pt-6">
                <dt className="text-label uppercase tracking-[0.1em] text-ink">
                  Total
                </dt>
                <dd className="font-serif text-2xl text-ink tabular-nums">
                  {formatCurrency(totals.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink href="/checkout" fullWidth size="lg">
                Proceed to checkout
              </ButtonLink>
              <ButtonLink href="/products" variant="ghost" fullWidth>
                Continue shopping
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
