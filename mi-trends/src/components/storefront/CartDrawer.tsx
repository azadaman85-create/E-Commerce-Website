"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { backdropVariants, drawerVariants, staggerList, EASE_TACTILE } from "@/lib/motion";
import { useCart } from "@/context/CartContext";
import { useCurrency, useSettings } from "@/context/SettingsContext";
import { useLockBodyScroll } from "@/hooks";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart();
  const formatCurrency = useCurrency();
  const settings = useSettings();

  useLockBodyScroll(isOpen);

  // Free-shipping progress uses the lowest threshold across methods; the
  // storefront only advertises the Standard tier here.
  const freeThreshold = 2000;
  const remaining = Math.max(0, freeThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeThreshold) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[85]">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeCart}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-hidden
          />

          <motion.aside
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-drawer"
          >
            <header className="flex items-center justify-between border-b border-hairline px-6 py-5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-ink" strokeWidth={1.5} aria-hidden />
                <h2 className="text-label uppercase tracking-[0.1em] text-ink">
                  Your cart
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  illustration="cart"
                  title="Your cart is empty"
                  description="Nothing here yet. Have a look at what's new."
                  action={
                    <ButtonLink href="/products" onClick={closeCart} variant="dark">
                      Continue shopping
                    </ButtonLink>
                  }
                />
              </div>
            ) : (
              <>
                {remaining > 0 && (
                  <div className="border-b border-hairline px-6 py-4">
                    <p className="text-caption normal-case tracking-normal text-muted">
                      You&rsquo;re {formatCurrency(remaining)} away from free shipping.
                    </p>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-ink/8">
                      <motion.div
                        className="h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: EASE_TACTILE }}
                      />
                    </div>
                  </div>
                )}

                <motion.ul
                  variants={staggerList}
                  initial="hidden"
                  animate="visible"
                  className="flex-1 overflow-y-auto px-6"
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
                        exit={{ opacity: 0, height: 0, x: 50, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3, ease: EASE_TACTILE }}
                        className="flex gap-4 overflow-hidden border-b border-hairline py-6 last:border-0"
                      >
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="relative h-28 w-22 shrink-0 overflow-hidden rounded-sm bg-cream"
                          style={{ width: 88 }}
                        >
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="88px"
                              className="object-cover"
                            />
                          )}
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeCart}
                            className="font-serif text-lg leading-snug text-ink transition-colors hover:text-accent"
                          >
                            {item.title}
                          </Link>

                          {item.variantInfo.length > 0 && (
                            <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                              {item.variantInfo
                                .map((v) => `${v.option_name}: ${v.value}`)
                                .join(" · ")}
                            </p>
                          )}

                          <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                            {formatCurrency(item.unitPrice)} each
                          </p>

                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex items-center rounded-sm border border-hairline">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                aria-label={`Decrease quantity of ${item.title}`}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <Minus className="h-3.5 w-3.5" aria-hidden />
                              </button>
                              <span className="w-8 text-center text-body-sm tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                disabled={item.quantity >= item.maxQuantity}
                                aria-label={`Increase quantity of ${item.title}`}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-body-sm font-medium text-ink">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItem(item.key)}
                                aria-label={`Remove ${item.title} from cart`}
                                className="cursor-pointer rounded-sm p-1.5 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>

                <footer className="border-t border-hairline bg-cream/40 px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-label uppercase tracking-[0.1em] text-muted">
                      Subtotal
                    </span>
                    <span className="font-serif text-2xl text-ink">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <p className="mt-2 text-caption normal-case tracking-normal text-muted">
                    Shipping
                    {settings.tax_inclusive ? " " : " and tax "}
                    calculated at checkout.
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <ButtonLink href="/checkout" onClick={closeCart} fullWidth size="lg">
                      Proceed to checkout
                    </ButtonLink>
                    <ButtonLink
                      href="/cart"
                      onClick={closeCart}
                      variant="secondary"
                      fullWidth
                    >
                      View cart
                    </ButtonLink>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
