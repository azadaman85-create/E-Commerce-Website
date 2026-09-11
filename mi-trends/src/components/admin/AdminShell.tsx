"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import type { Profile } from "@/types";

const navItems = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/categories", label: "Categories", Icon: FolderTree },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/coupons", label: "Coupons", Icon: Ticket },
  { href: "/admin/reviews", label: "Reviews", Icon: Star },
  { href: "/admin/messages", label: "Messages", Icon: Mail },
  { href: "/admin/content", label: "Content", Icon: LayoutTemplate },
  { href: "/admin/media", label: "Media", Icon: ImageIcon },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
  { href: "/admin/seo", label: "SEO", Icon: Search },
];

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-hairline px-6">
        <Link href="/admin" className="font-serif text-lg tracking-tight text-ink">
          MI TRENDS
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="cursor-pointer rounded-sm p-2 text-muted hover:bg-ink/5 lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4" aria-label="Admin">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-body-sm transition-colors",
                    active
                      ? "bg-accent/8 font-medium text-accent"
                      : "text-muted hover:bg-ink/4 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-hairline p-4">
        <Link
          href="/"
          className="mb-2 flex items-center gap-3 rounded-sm px-3 py-2.5 text-body-sm text-muted transition-colors hover:bg-ink/4 hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          View storefront
        </Link>

        <div className="flex items-center gap-3 rounded-sm px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-caption font-medium normal-case tracking-normal text-ink">
            {initials(profile.full_name ?? profile.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm text-ink">
              {profile.full_name ?? "Admin"}
            </p>
            <p className="truncate text-caption normal-case tracking-normal text-muted">
              {profile.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="shrink-0 cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-danger/8 hover:text-danger"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <aside className="hidden w-64 shrink-0 border-r border-hairline bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="absolute inset-y-0 left-0 w-64 bg-white"
            >
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-hairline bg-white/90 px-6 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="cursor-pointer rounded-sm p-2 text-ink hover:bg-ink/5"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <span className="font-serif text-lg text-ink">MI TRENDS</span>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_TACTILE }}
          className="min-w-0 flex-1 p-6 lg:p-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
