"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/BrandIcons";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/components/ui/Toast";
import type { Category } from "@/types";

const shopLinks = [
  { href: "/products", label: "All products" },
  { href: "/products?sort=newest", label: "New arrivals" },
  { href: "/products?sort=best-selling", label: "Best sellers" },
  { href: "/search", label: "Search" },
];

const helpLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/returns-policy", label: "Returns" },
];

const legalLinks = [
  { href: "/about", label: "About us" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/account", label: "My account" },
];

export function Footer({ categories }: { categories: Category[] }) {
  const settings = useSettings();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const socials = [
    { href: settings.social_instagram, Icon: InstagramIcon, label: "Instagram" },
    { href: settings.social_facebook, Icon: FacebookIcon, label: "Facebook" },
    { href: settings.social_twitter, Icon: XIcon, label: "X" },
    { href: settings.social_tiktok, Icon: TiktokIcon, label: "TikTok" },
    { href: settings.social_youtube, Icon: YoutubeIcon, label: "YouTube" },
  ].filter((s): s is { href: string; Icon: typeof InstagramIcon; label: string } =>
    Boolean(s.href),
  );

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("You're on the list", "Look out for our next dispatch.");
        setEmail("");
      } else {
        toast.error("Couldn't subscribe", data.error ?? "Please try again.");
      }
    } catch {
      toast.error("Couldn't subscribe", "Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const columnLink =
    "text-body-sm text-white/60 transition-colors hover:text-white";

  return (
    <footer className="mt-20 bg-ink text-white md:mt-30">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-4">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-gold/40">
                <Image
                  src={settings.logo_inverted_url ?? settings.logo_url ?? "/logo.jpeg"}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-foil font-serif text-2xl tracking-[0.08em]">
                  {settings.site_name}
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.28em] text-gold/60">
                  Clothing Brand
                </span>
              </span>
            </Link>

            {settings.tagline && (
              <p className="mt-4 max-w-xs text-body-sm leading-relaxed text-white/55">
                {settings.tagline}
              </p>
            )}

            <form onSubmit={subscribe} className="mt-8 max-w-sm">
              <label
                htmlFor="newsletter-email"
                className="text-caption uppercase tracking-[0.1em] text-white/50"
              >
                Join the list
              </label>
              <div className="mt-3 flex items-center gap-2 border-b border-white/20 pb-2 focus-within:border-white/60">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-body-sm text-white outline-none placeholder:text-white/30"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.94 }}
                  disabled={submitting}
                  aria-label="Subscribe to newsletter"
                  className="shrink-0 cursor-pointer rounded-sm p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-caption uppercase tracking-[0.1em] text-white/50">
              Shop
            </h3>
            <ul className="mt-6 flex flex-col gap-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={columnLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {categories.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link href={`/products?category=${c.slug}`} className={columnLink}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-caption uppercase tracking-[0.1em] text-white/50">
              Help
            </h3>
            <ul className="mt-6 flex flex-col gap-3">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={columnLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-caption uppercase tracking-[0.1em] text-white/50">
              Company
            </h3>
            <ul className="mt-6 flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={columnLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(settings.contact_email || settings.contact_phone || settings.business_address) && (
          <div className="mt-16 flex flex-col gap-2 border-t border-white/10 pt-8 text-body-sm text-white/50 md:flex-row md:gap-8">
            {settings.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="transition-colors hover:text-white"
              >
                {settings.contact_email}
              </a>
            )}
            {settings.contact_phone && (
              <a
                href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                className="transition-colors hover:text-white"
              >
                {settings.contact_phone}
              </a>
            )}
            {settings.business_address && <span>{settings.business_address}</span>}
          </div>
        )}

        <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <p className="text-caption normal-case tracking-normal text-white/40">
            © {new Date().getFullYear()} {settings.site_name}. All rights reserved.
          </p>

          {socials.length > 0 && (
            <div className="flex items-center gap-2">
              {socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="cursor-pointer rounded-sm p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}

          {/* Payment methods accepted via Razorpay. */}
          <div className="flex items-center gap-3 text-caption normal-case tracking-normal text-white/40">
            {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"].map((method) => (
              <span
                key={method}
                className="rounded-sm border border-white/15 px-2 py-1"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
