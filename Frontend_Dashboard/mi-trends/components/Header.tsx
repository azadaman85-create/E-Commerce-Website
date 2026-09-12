"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { useStore } from "@/components/StoreProvider";

const primaryLinks = [
  { label: "Men", href: "/shop?category=men", menu: true },
  { label: "Women", href: "/shop?category=women", menu: true },
  { label: "Collections", href: "/shop?browse=collections", menu: true },
  { label: "New", href: "/shop?tag=new" },
  { label: "Sale", href: "/shop?tag=sale", accent: true },
];

const announcementItems = [
  "Free shipping over ₹999",
  "Easy 30-day returns",
  "Cash on delivery available",
  "Save 10% with MI10",
];

function menuColumns(section: string) {
  const category = section === "Men" || section === "Women";
  const categoryQuery = category ? `&category=${section.toLowerCase()}` : "";

  return [
    {
      heading: "Everyday icons",
      links: [
        { label: "Graphic tees", href: `/shop?type=t-shirts${categoryQuery}` },
        { label: "Oversized tees", href: `/shop?type=oversized-tees${categoryQuery}` },
        { label: "Shirts", href: `/shop?type=shirts${categoryQuery}` },
        { label: "Hoodies", href: `/shop?type=hoodies${categoryQuery}` },
      ],
    },
    {
      heading: "Off-duty",
      links: [
        { label: "Joggers", href: `/shop?type=joggers${categoryQuery}` },
        { label: "Shorts", href: `/shop?type=shorts${categoryQuery}` },
        { label: "Co-ord sets", href: `/shop?type=co-ords${categoryQuery}` },
        { label: "Sweatshirts", href: `/shop?type=sweatshirts${categoryQuery}` },
      ],
    },
    {
      heading: "The good stuff",
      links: [
        { label: "New arrivals", href: `/shop?tag=new${categoryQuery}` },
        { label: "Bestsellers", href: `/shop?tag=bestseller${categoryQuery}` },
        { label: "Under ₹799", href: `/shop?maxPrice=799${categoryQuery}` },
        { label: "Sale", href: `/shop?tag=sale${categoryQuery}` },
      ],
    },
    {
      heading: "Finish the fit",
      links: [
        { label: "Sneakers", href: "/shop?type=sneakers" },
        { label: "Caps", href: "/shop?type=caps" },
        { label: "Backpacks", href: "/shop?type=backpacks" },
        { label: "Socks", href: "/shop?type=socks" },
      ],
    },
  ];
}

export function Header() {
  const {
    cartCount,
    wishlistCount,
    openCart,
    openSearch,
    openMobileNav,
  } = useStore();
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const columns = activeMegaMenu ? menuColumns(activeMegaMenu) : [];

  return (
    <>
      <aside className="announcement-bar" aria-label="Store announcements">
        <div className="announcement-track">
          {announcementItems.map((item) => (
            <span className="announcement-item" key={item}>
              {item}
            </span>
          ))}
          <span className="announcement-repeat" aria-hidden="true">
            {announcementItems.map((item) => (
              <span className="announcement-item" key={`repeat-${item}`}>
                {item}
              </span>
            ))}
          </span>
        </div>
      </aside>

      <header className="site-header">
        <div className="header-main shell">
          <button
            className="icon-button mobile-menu-trigger"
            type="button"
            aria-label="Open navigation menu"
            onClick={openMobileNav}
          >
            <Menu aria-hidden="true" size={22} />
          </button>

          <Link className="brand-lockup" href="/" aria-label="MI TRENDS home">
            <span className="brand-mark" aria-hidden="true">
              MI
            </span>
            <span className="brand-name">TRENDS</span>
          </Link>

          <div className="header-actions">
            <button
              className="header-search-trigger"
              type="button"
              onClick={openSearch}
              aria-label="Search MI TRENDS"
            >
              <Search aria-hidden="true" size={19} />
              <span className="header-search-label">Search styles</span>
              <kbd className="search-shortcut" aria-hidden="true">
                /
              </kbd>
            </button>

            <Link
              className="icon-button header-account-link hidden md:inline-grid"
              href="/info/account"
              aria-label="Your account"
            >
              <UserRound aria-hidden="true" size={21} />
            </Link>

            <Link
              className="icon-button count-button"
              href="/wishlist"
              aria-label={`Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}
            >
              <Heart aria-hidden="true" size={21} />
              {wishlistCount > 0 && (
                <span className="count-badge" aria-hidden="true">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <button
              className="icon-button count-button"
              type="button"
              onClick={openCart}
              aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            >
              <ShoppingBag aria-hidden="true" size={21} />
              {cartCount > 0 && (
                <span className="count-badge" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mobile-search-bar">
          <button
            type="button"
            className="mobile-search-bar__btn"
            onClick={openSearch}
            aria-label="Search clothing, oversized tees, sneakers"
          >
            <Search size={16} aria-hidden="true" />
            <span className="mobile-search-bar__text">Search for oversized tees, hoodies, sneakers...</span>
          </button>
        </div>

        <div
          className="desktop-navigation"
          onMouseLeave={() => setActiveMegaMenu(null)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setActiveMegaMenu(null);
            }
          }}
        >
          <nav className="primary-nav shell" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <div
                className={`primary-nav-item${
                  activeMegaMenu === link.label ? " is-active" : ""
                }`}
                key={link.label}
                onMouseEnter={() =>
                  setActiveMegaMenu(link.menu ? link.label : null)
                }
              >
                <Link
                  className={`primary-nav-link${link.accent ? " is-sale" : ""}`}
                  href={link.href}
                  aria-haspopup={link.menu ? "true" : undefined}
                  aria-expanded={
                    link.menu ? activeMegaMenu === link.label : undefined
                  }
                  onFocus={() =>
                    setActiveMegaMenu(link.menu ? link.label : null)
                  }
                  onClick={() => setActiveMegaMenu(null)}
                >
                  {link.label}
                  {link.menu && <ChevronDown aria-hidden="true" size={13} />}
                </Link>
              </div>
            ))}
          </nav>

          {activeMegaMenu && (
            <section
              className="mega-menu"
              aria-label={`${activeMegaMenu} shopping menu`}
            >
              <div className="mega-menu-inner shell">
                <div className="mega-menu-columns">
                  {columns.map((column) => (
                    <div className="mega-menu-column" key={column.heading}>
                      <p className="mega-menu-heading">{column.heading}</p>
                      <ul className="mega-menu-list">
                        {column.links.map((link) => (
                          <li key={`${column.heading}-${link.label}`}>
                            <Link
                              href={link.href}
                              onClick={() => setActiveMegaMenu(null)}
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <Link
                  className="mega-menu-promo"
                  href="/shop?tag=new"
                  onClick={() => setActiveMegaMenu(null)}
                >
                  <span className="promo-eyebrow">New drop</span>
                  <strong>Original graphics. Zero background energy.</strong>
                  <span className="text-link">Shop the edit</span>
                </Link>
              </div>
            </section>
          )}
        </div>
      </header>
    </>
  );
}

export default Header;
