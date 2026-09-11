"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/Button";
import { Input, Checkbox } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CouponField } from "@/components/storefront/CouponField";
import { useToast } from "@/components/ui/Toast";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/SettingsContext";
import { computeTotals } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import type {
  Address,
  AppliedCoupon,
  OrderAddress,
  Profile,
  ShippingMethod,
  SiteSettings,
} from "@/types";

const STEPS = ["Shipping", "Payment", "Review"] as const;
type Step = 0 | 1 | 2;

const EMPTY_ADDRESS: OrderAddress = {
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  country: "India",
};

interface Props {
  shippingMethods: ShippingMethod[];
  settings: SiteSettings;
  savedAddresses: Address[];
  profile: Profile | null;
  userEmail: string | null;
}

export function CheckoutClient({
  shippingMethods,
  settings,
  savedAddresses,
  profile,
  userEmail,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const formatCurrency = useCurrency();
  const { items, subtotal, clearCart, hydrated } = useCart();

  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState(userEmail ?? "");
  const [address, setAddress] = useState<OrderAddress>(() => {
    const preferred = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];
    if (!preferred) {
      return { ...EMPTY_ADDRESS, full_name: profile?.full_name ?? "" };
    }
    return {
      full_name: preferred.full_name,
      phone: preferred.phone,
      address_line1: preferred.address_line1,
      address_line2: preferred.address_line2,
      city: preferred.city,
      state: preferred.state,
      zip: preferred.zip,
      country: preferred.country,
    };
  });

  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<OrderAddress>(EMPTY_ADDRESS);
  const [methodId, setMethodId] = useState(shippingMethods[0]?.id ?? "");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const selectedMethod = useMemo(
    () => shippingMethods.find((m) => m.id === methodId) ?? null,
    [shippingMethods, methodId],
  );

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        coupon,
        shippingMethod: selectedMethod,
        taxRate: Number(settings.tax_rate),
        taxInclusive: settings.tax_inclusive,
      }),
    [items, coupon, selectedMethod, settings],
  );

  // Send an empty cart back to the storefront rather than showing a dead form.
  useEffect(() => {
    if (hydrated && items.length === 0 && !placing) {
      // Deliberately not redirecting — an explicit empty state is clearer.
    }
  }, [hydrated, items.length, placing]);

  function validateShipping(): boolean {
    const next: Record<string, string> = {};

    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!address.full_name.trim()) next.full_name = "Required.";
    if (!address.address_line1.trim()) next.address_line1 = "Required.";
    if (!address.city.trim()) next.city = "Required.";
    if (!address.state.trim()) next.state = "Required.";
    if (!address.zip.trim()) next.zip = "Required.";
    if (!address.country.trim()) next.country = "Required.";

    if (!billingSame) {
      if (!billing.full_name.trim()) next.b_full_name = "Required.";
      if (!billing.address_line1.trim()) next.b_address_line1 = "Required.";
      if (!billing.city.trim()) next.b_city = "Required.";
      if (!billing.state.trim()) next.b_state = "Required.";
      if (!billing.zip.trim()) next.b_zip = "Required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function placeOrder() {
    if (!selectedMethod) {
      toast.error("Choose a shipping method");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          shippingAddress: address,
          billingAddress: billingSame ? address : billing,
          shippingMethodId: selectedMethod.id,
          couponCode: coupon?.code ?? null,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Couldn't place your order", data.error ?? "Please try again.");
        setPlacing(false);
        return;
      }

      // Razorpay not configured (e.g. a fresh clone without keys) — the order
      // still exists as pending so the flow is demoable end to end.
      if (!data.paymentConfigured || !data.razorpayOrderId) {
        clearCart();
        router.push(`/order-confirmation/${data.orderNumber}?pending=1`);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment unavailable", "Reload the page and try again.");
        setPlacing(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        name: settings.site_name,
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: address.full_name,
          email: email.trim(),
          contact: address.phone ?? "",
        },
        theme: { color: "#2563EB" },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast.info("Payment cancelled", "Your order is saved as pending.");
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              // The webhook is the backstop here, so the order is not lost.
              toast.error(
                "Payment received, confirming…",
                "We'll email you once it's confirmed.",
              );
            }

            clearCart();
            router.push(`/order-confirmation/${data.orderNumber}`);
          } catch {
            clearCart();
            router.push(`/order-confirmation/${data.orderNumber}`);
          }
        },
      });

      checkout.open();
    } catch {
      toast.error("Couldn't place your order", "Check your connection and try again.");
      setPlacing(false);
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          illustration="cart"
          title="Nothing to check out"
          description="Your cart is empty. Add something first."
          action={
            <ButtonLink href="/products" variant="dark" size="lg">
              Browse products
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const fieldGrid = "grid gap-5 sm:grid-cols-2";

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div className="container-page py-12 md:py-16">
        <header className="mb-12">
          <Link
            href="/cart"
            className="mb-6 inline-flex items-center gap-2 text-caption uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back to cart
          </Link>
          <h1 className="font-serif text-section-sm leading-tight text-ink md:text-section">
            Checkout
          </h1>
        </header>

        {/* Step indicator */}
        <div className="mb-12">
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-caption transition-colors",
                      i < step
                        ? "border-accent bg-accent text-white"
                        : i === step
                          ? "border-ink bg-ink text-white"
                          : "border-ink/15 text-muted",
                    )}
                  >
                    {i < step ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "hidden text-caption uppercase tracking-[0.1em] sm:block",
                      i <= step ? "text-ink" : "text-muted",
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-4 h-px flex-1 bg-ink/10">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: i < step ? 1 : 0 }}
                      style={{ originX: 0 }}
                      transition={{ duration: 0.4, ease: EASE_TACTILE }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          <div>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.section
                  key="shipping"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: EASE_TACTILE }}
                >
                  <h2 className="font-serif text-2xl text-ink">Contact</h2>
                  <div className="mt-6">
                    <Input
                      label="Email address"
                      type="email"
                      required
                      value={email}
                      error={errors.email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <h2 className="mt-12 font-serif text-2xl text-ink">
                    Shipping address
                  </h2>

                  {savedAddresses.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {savedAddresses.map((saved) => (
                        <button
                          key={saved.id}
                          type="button"
                          onClick={() =>
                            setAddress({
                              full_name: saved.full_name,
                              phone: saved.phone,
                              address_line1: saved.address_line1,
                              address_line2: saved.address_line2,
                              city: saved.city,
                              state: saved.state,
                              zip: saved.zip,
                              country: saved.country,
                            })
                          }
                          className="cursor-pointer rounded-sm border border-ink/15 px-4 py-2 text-caption normal-case tracking-normal text-muted transition-colors hover:border-ink/45 hover:text-ink"
                        >
                          Use {saved.city} address
                          {saved.is_default ? " (default)" : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-5">
                    <div className={fieldGrid}>
                      <Input
                        label="Full name"
                        required
                        value={address.full_name}
                        error={errors.full_name}
                        onChange={(e) =>
                          setAddress({ ...address, full_name: e.target.value })
                        }
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={address.phone ?? ""}
                        onChange={(e) =>
                          setAddress({ ...address, phone: e.target.value })
                        }
                      />
                    </div>

                    <Input
                      label="Address line 1"
                      required
                      value={address.address_line1}
                      error={errors.address_line1}
                      onChange={(e) =>
                        setAddress({ ...address, address_line1: e.target.value })
                      }
                    />
                    <Input
                      label="Address line 2"
                      value={address.address_line2 ?? ""}
                      onChange={(e) =>
                        setAddress({ ...address, address_line2: e.target.value })
                      }
                    />

                    <div className={fieldGrid}>
                      <Input
                        label="City"
                        required
                        value={address.city}
                        error={errors.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                      <Input
                        label="State / Province"
                        required
                        value={address.state}
                        error={errors.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      />
                    </div>

                    <div className={fieldGrid}>
                      <Input
                        label="ZIP / Postal code"
                        required
                        value={address.zip}
                        error={errors.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      />
                      <Input
                        label="Country"
                        required
                        value={address.country}
                        error={errors.country}
                        onChange={(e) =>
                          setAddress({ ...address, country: e.target.value })
                        }
                      />
                    </div>

                    <div className="pt-2">
                      <Checkbox
                        label="Billing address is the same as shipping"
                        checked={billingSame}
                        onChange={(e) => setBillingSame(e.target.checked)}
                      />
                    </div>

                    {!billingSame && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3, ease: EASE_TACTILE }}
                        className="flex flex-col gap-5 overflow-hidden pt-4"
                      >
                        <h3 className="font-serif text-xl text-ink">Billing address</h3>
                        <Input
                          label="Full name"
                          required
                          value={billing.full_name}
                          error={errors.b_full_name}
                          onChange={(e) =>
                            setBilling({ ...billing, full_name: e.target.value })
                          }
                        />
                        <Input
                          label="Address line 1"
                          required
                          value={billing.address_line1}
                          error={errors.b_address_line1}
                          onChange={(e) =>
                            setBilling({ ...billing, address_line1: e.target.value })
                          }
                        />
                        <div className={fieldGrid}>
                          <Input
                            label="City"
                            required
                            value={billing.city}
                            error={errors.b_city}
                            onChange={(e) =>
                              setBilling({ ...billing, city: e.target.value })
                            }
                          />
                          <Input
                            label="State / Province"
                            required
                            value={billing.state}
                            error={errors.b_state}
                            onChange={(e) =>
                              setBilling({ ...billing, state: e.target.value })
                            }
                          />
                        </div>
                        <div className={fieldGrid}>
                          <Input
                            label="ZIP / Postal code"
                            required
                            value={billing.zip}
                            error={errors.b_zip}
                            onChange={(e) =>
                              setBilling({ ...billing, zip: e.target.value })
                            }
                          />
                          <Input
                            label="Country"
                            required
                            value={billing.country}
                            onChange={(e) =>
                              setBilling({ ...billing, country: e.target.value })
                            }
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-10">
                    <Button
                      size="lg"
                      onClick={() => {
                        if (validateShipping()) setStep(1);
                      }}
                    >
                      Continue to payment
                    </Button>
                  </div>
                </motion.section>
              )}

              {step === 1 && (
                <motion.section
                  key="payment"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: EASE_TACTILE }}
                >
                  <h2 className="font-serif text-2xl text-ink">Shipping method</h2>

                  <div className="mt-6 flex flex-col gap-3">
                    {shippingMethods.map((method) => {
                      const free =
                        method.free_shipping_threshold !== null &&
                        subtotal - (coupon?.discount ?? 0) >= method.free_shipping_threshold;
                      const selected = methodId === method.id;

                      return (
                        <label
                          key={method.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-6 rounded-sm border p-5 transition-all",
                            selected
                              ? "border-accent bg-accent/4"
                              : "border-ink/12 hover:border-ink/35",
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="shipping-method"
                              value={method.id}
                              checked={selected}
                              onChange={() => setMethodId(method.id)}
                              className="h-4 w-4 cursor-pointer accent-accent"
                            />
                            <div>
                              <span className="block text-body-sm font-medium text-ink">
                                {method.name}
                              </span>
                              {method.estimated_delivery && (
                                <span className="text-caption normal-case tracking-normal text-muted">
                                  {method.estimated_delivery}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-body-sm text-ink">
                            {free || Number(method.price) === 0
                              ? "Free"
                              : formatCurrency(Number(method.price))}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <h2 className="mt-12 font-serif text-2xl text-ink">Payment</h2>
                  <div className="mt-6 rounded-sm border border-ink/12 p-6">
                    <div className="flex items-start gap-4">
                      <Lock
                        className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <div>
                        <p className="text-body-sm font-medium text-ink">
                          Secure payment via Razorpay
                        </p>
                        <p className="mt-2 text-body-sm leading-relaxed text-muted">
                          Card, UPI, net banking and wallets are all accepted. The
                          payment window opens when you place your order — your
                          card details are entered on Razorpay&rsquo;s own secure
                          form and never reach our servers.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 border-t border-hairline pt-6">
                      {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "Wallets"].map(
                        (label) => (
                          <span
                            key={label}
                            className="rounded-sm border border-hairline px-3 py-1.5 text-caption normal-case tracking-normal text-muted"
                          >
                            {label}
                          </span>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep(0)}>
                      Back
                    </Button>
                    <Button size="lg" onClick={() => setStep(2)} disabled={!methodId}>
                      Review order
                    </Button>
                  </div>
                </motion.section>
              )}

              {step === 2 && (
                <motion.section
                  key="review"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: EASE_TACTILE }}
                >
                  <h2 className="font-serif text-2xl text-ink">Review your order</h2>

                  <ul className="mt-6 flex flex-col divide-y divide-hairline border-y border-hairline">
                    {items.map((item) => (
                      <li key={item.key} className="flex gap-4 py-5">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-cream">
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-lg text-ink">{item.title}</p>
                          {item.variantInfo.length > 0 && (
                            <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                              {item.variantInfo
                                .map((v) => `${v.option_name}: ${v.value}`)
                                .join(" · ")}
                            </p>
                          )}
                          <p className="mt-1 text-caption normal-case tracking-normal text-muted">
                            Qty {item.quantity}
                          </p>
                        </div>
                        <span className="text-body-sm text-ink">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <div>
                      <h3 className="label-caps">Ship to</h3>
                      <address className="mt-3 not-italic text-body-sm leading-relaxed text-muted">
                        {address.full_name}
                        <br />
                        {address.address_line1}
                        {address.address_line2 && (
                          <>
                            <br />
                            {address.address_line2}
                          </>
                        )}
                        <br />
                        {address.city}, {address.state} {address.zip}
                        <br />
                        {address.country}
                        {address.phone && (
                          <>
                            <br />
                            {address.phone}
                          </>
                        )}
                      </address>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="mt-3 cursor-pointer text-caption normal-case tracking-normal text-accent underline underline-offset-4"
                      >
                        Edit
                      </button>
                    </div>

                    <div>
                      <h3 className="label-caps">Shipping &amp; payment</h3>
                      <p className="mt-3 text-body-sm leading-relaxed text-muted">
                        {selectedMethod?.name}
                        {selectedMethod?.estimated_delivery && (
                          <>
                            <br />
                            {selectedMethod.estimated_delivery}
                          </>
                        )}
                        <br />
                        Razorpay ({email})
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="mt-3 cursor-pointer text-caption normal-case tracking-normal text-accent underline underline-offset-4"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="mt-10 flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      size="lg"
                      loading={placing}
                      onClick={placeOrder}
                      className="flex-1"
                    >
                      {placing ? "Processing…" : `Place order · ${formatCurrency(totals.total)}`}
                    </Button>
                  </div>

                  {!scriptReady && (
                    <p className="mt-4 text-caption normal-case tracking-normal text-muted">
                      Loading secure payment…
                    </p>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </div>

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
                  <dt className="text-muted">
                    Subtotal ({items.length} item{items.length === 1 ? "" : "s"})
                  </dt>
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
                  <dt className="text-muted">Shipping</dt>
                  <dd className="text-ink tabular-nums">
                    {selectedMethod
                      ? totals.shipping === 0
                        ? "Free"
                        : formatCurrency(totals.shipping)
                      : "—"}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-muted">
                    Tax ({settings.tax_rate}%{settings.tax_inclusive ? ", incl." : ""})
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

              <p className="mt-6 flex items-center gap-2 text-caption normal-case tracking-normal text-muted">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Encrypted and secure
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
