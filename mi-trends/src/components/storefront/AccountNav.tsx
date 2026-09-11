"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

const links = [
  { href: "/account", label: "Overview", Icon: User },
  { href: "/account/orders", label: "Orders", Icon: Package },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account/profile", label: "Profile", Icon: User },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isAdmin } = useAuth();
  const toast = useToast();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
      {/* Horizontal tab bar on mobile, vertical sidebar on desktop. */}
      <ul className="no-scrollbar -mx-6 flex gap-1 overflow-x-auto px-6 lg:mx-0 lg:flex-col lg:px-0">
        {links.map(({ href, label, Icon }) => {
          const active =
            href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-4 py-3 text-body-sm transition-colors lg:w-full",
                  active
                    ? "bg-cream font-medium text-ink"
                    : "text-muted hover:bg-cream/60 hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}

        {isAdmin && (
          <li className="shrink-0">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-sm px-4 py-3 text-body-sm text-accent transition-colors hover:bg-accent/8 lg:w-full"
            >
              <Package className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Admin panel
            </Link>
          </li>
        )}

        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-hairline lg:pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-4 py-3 text-body-sm text-muted transition-colors hover:bg-danger/8 hover:text-danger"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
