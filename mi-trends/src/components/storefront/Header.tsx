"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useScrolled, useLockBodyScroll } from "@/hooks";
import { SearchModal } from "@/components/storefront/SearchModal";

export function Header() {
  const pathname = usePathname();
  const settings = useSettings();
  const scrolled = useScrolled(24);
  const { itemCount, openCart, registerCartTarget, bumpToken, hydrated } = useCart();
  const { user } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const bagControls = useAnimation();

  useLockBodyScroll(mobileOpen);

  // Hand the cart icon's DOM node to the cart context so the flying ghost
  // image knows where to fly to.
  useEffect(() => {
    registerCartTarget(cartIconRef.current);
    return () => registerCartTarget(null);
  }, [registerCartTarget]);

  // Spring bounce on the bag whenever something is added.
  useEffect(() => {
    if (bumpToken === 0) return;
    void bagControls.start({
      scale: [1, 1.3, 1],
      transition: { type: "spring", stiffness: 400, damping: 12 },
    });
  }, [bumpToken, bagControls]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Cmd/Ctrl-K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Exactly five destinations. Category links live in the PLP sidebar, not
  // the header, so the top level stays about who is shopping rather than what.
  const navLinks = [
    { href: "/men", label: "Men" },
    { href: "/women", label: "Women" },
    { href: "/products", label: "Collection" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact Us" },
  ];

  const isSection = (href: string) =>
    href === "/products" ? pathname === "/products" : pathname.startsWith(href);

  const iconButton =
    "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm " +
    "text-white/80 transition-colors hover:bg-white/10 hover:text-gold-light";

  return (
    <>
      {settings.announcement_bar_active && settings.announcement_bar_text && (
        <div
          className="w-full py-2 text-center text-caption uppercase tracking-[0.1em] text-white"
          style={{ backgroundColor: settings.announcement_bar_color ?? "#1A1A1A" }}
        >
          {settings.announcement_bar_link ? (
            <Link href={settings.announcement_bar_link} className="hover:underline">
              {settings.announcement_bar_text}
            </Link>
          ) : (
            settings.announcement_bar_text
          )}
        </div>
      )}

      <motion.header
        animate={{ height: scrolled ? 60 : 80 }}
        transition={{ duration: 0.3, ease: EASE_TACTILE }}
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-colors duration-300",
          // Dark throughout: the logo's own ground is #1b1c20, so anything
          // lighter would frame it in a visible grey box.
          scrolled
            ? "border-gold/25 bg-ink/90 backdrop-blur-md"
            : "border-transparent bg-ink",
        )}
      >
        <div className="container-page flex h-full items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(iconButton, "lg:hidden")}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            <Link
              href="/"
              className="flex shrink-0 items-center gap-3"
              aria-label={`${settings.site_name} — home`}
            >
              {/*
                The supplied logo is a JPEG with a dark square ground. Masking
                it to a circle drops the corners entirely, so it reads as an
                emblem rather than a pasted-on tile.
              */}
              <motion.span
                animate={{ height: scrolled ? 34 : 42, width: scrolled ? 34 : 42 }}
                transition={{ duration: 0.3, ease: EASE_TACTILE }}
                className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-gold/40"
              >
                <Image
                  src={settings.logo_url ?? "/logo.jpeg"}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                  priority
                />
              </motion.span>

              <span className="flex flex-col leading-none">
                <span className="text-foil font-serif text-lg tracking-[0.08em] md:text-xl">
                  {settings.site_name}
                </span>
                <span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.28em] text-gold/60 sm:block">
                  Clothing Brand
                </span>
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isSection(link.href) ? "page" : undefined}
                className={cn(
                  "relative text-caption uppercase tracking-[0.1em] transition-colors hover:text-gold-light",
                  isSection(link.href) ? "text-gold-light" : "text-white/70",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className={iconButton}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>

            <Link
              href={user ? "/account/wishlist" : "/auth?next=/account/wishlist"}
              aria-label="Wishlist"
              className={cn(iconButton, "hidden sm:flex")}
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </Link>

            <Link
              href={user ? "/account" : "/auth"}
              aria-label={user ? "My account" : "Sign in"}
              className={iconButton}
            >
              <User className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </Link>

            <motion.button
              ref={cartIconRef}
              type="button"
              onClick={openCart}
              animate={bagControls}
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              className={iconButton}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              <AnimatePresence>
                {hydrated && itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-ink"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Full-screen mobile menu with staggered links entering from the left. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="surface-dark fixed inset-0 z-[80] lg:hidden"
          >
            <div className="container-page flex h-20 items-center justify-between">
              <span className="text-foil font-serif text-xl">
                {settings.site_name}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className={iconButton}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <motion.nav
              className="container-page flex flex-col gap-2 pt-8"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              aria-label="Mobile"
            >
              {[...navLinks, { href: "/account", label: "Account" }].map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, x: -24 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.4, ease: EASE_TACTILE }}
                >
                  <Link
                    href={link.href}
                    className="block py-4 font-serif text-3xl text-white transition-colors hover:text-gold-light"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
