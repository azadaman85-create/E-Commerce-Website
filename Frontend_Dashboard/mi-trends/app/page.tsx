"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  WalletCards,
} from "lucide-react";
import { useCatalog } from "@/components/CatalogProvider";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";

const heroSlides = [
  {
    kicker: "DROP 01 · AFTERDARK",
    title: "LOUD AFTER\nLIGHTS OUT.",
    copy: "Night-shift graphics on heavyweight cotton. Built for the plans that start late.",
    cta: "Shop the drop",
    href: "/shop?collection=afterdark",
    palette: ["#ff4d28", "#ffcf3f", "#1c1817"],
    word: "01",
    image: "/images/hero-afterdark.jpg",
  },
  {
    kicker: "THE OVERSIZED EDIT",
    title: "MORE ROOM.\nMORE YOU.",
    copy: "Relaxed proportions, soft structure and the right kind of extra.",
    cta: "Explore oversized",
    href: "/shop?type=oversized-tees",
    palette: ["#b8d7ff", "#123f8e", "#f8f5ec"],
    word: "XL",
    image: "/images/hero-oversized.jpg",
  },
  {
    kicker: "CITY COURT COLLECTION",
    title: "OFF DUTY.\nON POINT.",
    copy: "Varsity energy, courtside colour and everyday layers that always make the cut.",
    cta: "Enter the court",
    href: "/shop?collection=city-court",
    palette: ["#caef67", "#15564b", "#f7f0dc"],
    word: "88",
    image: "/images/hero-court.jpg",
  },
  {
    kicker: "FRESH PAIRS",
    title: "START FROM\nTHE GROUND UP.",
    copy: "Cushioned sneakers with bold panels, made for all-day city miles.",
    cta: "Shop sneakers",
    href: "/shop?type=sneakers",
    palette: ["#dfc7ff", "#6129a8", "#ff5e88"],
    word: "GO",
    image: "/images/hero-sneakers.jpg",
  },
] as const;

const homeCategories = [
  { label: "Oversized", symbol: "OVR", href: "/shop?type=oversized-tees", tone: "peach", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=240&auto=format&fit=crop&q=80" },
  { label: "T-shirts", symbol: "TEE", href: "/shop?type=t-shirts", tone: "blue", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=240&auto=format&fit=crop&q=80" },
  { label: "Shirts", symbol: "SHT", href: "/shop?type=shirts", tone: "lime", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=240&auto=format&fit=crop&q=80" },
  { label: "Hoodies", symbol: "HDY", href: "/shop?type=hoodies", tone: "lilac", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=240&auto=format&fit=crop&q=80" },
  { label: "Bottoms", symbol: "JGR", href: "/shop?type=joggers", tone: "sand", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=240&auto=format&fit=crop&q=80" },
  { label: "Sneakers", symbol: "SNK", href: "/shop?type=sneakers", tone: "red", image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=240&auto=format&fit=crop&q=80" },
  { label: "Accessories", symbol: "ACC", href: "/shop?category=accessories", tone: "mint", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=240&auto=format&fit=crop&q=80" },
] as const;

const editorials = [
  {
    overline: "Weekend uniform",
    title: "ZERO PLANS CLUB",
    copy: "Easy layers for very serious lounging.",
    href: "/shop?collection=zero-plans-club",
    className: "editorial-card--orange",
    art: "ZPC",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
  },
  {
    overline: "Original graphics",
    title: "LOCAL FREQUENCY",
    copy: "Street signals, tuned our way.",
    href: "/shop?collection=local-frequency",
    className: "editorial-card--blue",
    art: "91.8",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&auto=format&fit=crop&q=80",
  },
  {
    overline: "Utility capsule",
    title: "OUT OF OFFICE",
    copy: "Pack light. Go further. Repeat.",
    href: "/shop?collection=out-of-office",
    className: "editorial-card--green",
    art: "OOO",
    image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=900&auto=format&fit=crop&q=80",
  },
] as const;

const collectionTiles = [
  ["Afterdark", "Neon hours. Heavy cotton.", "afterdark", "collection-tile--coral"],
  ["Local Frequency", "Homegrown signals only.", "local-frequency", "collection-tile--blue"],
  ["City Court", "Warm-up energy, all day.", "city-court", "collection-tile--lime"],
  ["Soft Launch", "Pastels without the hush.", "soft-launch", "collection-tile--pink"],
  ["Out of Office", "Utility for the escape.", "out-of-office", "collection-tile--sand"],
  ["Analog Dreams", "Retro pixels, new memories.", "analog-dreams", "collection-tile--purple"],
  ["Zero Plans Club", "Comfort has a dress code.", "zero-plans-club", "collection-tile--yellow"],
  ["MI Originals", "The signature rotation.", "mi-originals", "collection-tile--ink"],
] as const;

function HeroArtwork({ slide }: { slide: (typeof heroSlides)[number] }) {
  return (
    <div className="hero-art-media">
      <div className="hero-art-frame">
        <img
          src={slide.image}
          alt={slide.title.replace("\n", " ")}
          className="hero-art-img"
          referrerPolicy="no-referrer"
        />
        <div className="hero-art-badge">
          <span className="hero-art-badge__num">{slide.word}</span>
          <span className="hero-art-badge__sub">MI TRENDS</span>
        </div>
        <div className="hero-art-tag">
          <span>ORIGINAL STREETWEAR</span>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="text-link">
          {linkLabel} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const products = useCatalog();
  const { showToast } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<"trending" | "new" | "deals" | "oversized">("trending");
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const touchStart = useRef<number | null>(null);

  const trending = useMemo(() => [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 9), [products]);
  const newDrops = useMemo(() => products.filter((product) => product.tags.includes("new")).slice(0, 8), [products]);
  const deals = useMemo(() => {
    const under = products.filter((product) => product.price <= 799);
    return (under.length >= 6 ? under : [...products].sort((a, b) => a.price - b.price)).slice(0, 9);
  }, [products]);
  const oversized = useMemo(() => products.filter((product) => product.type === "oversized-tees").slice(0, 8), [products]);

  const activeFeedProducts = useMemo(() => {
    switch (activeFeedTab) {
      case "new":
        return newDrops;
      case "deals":
        return deals;
      case "oversized":
        return oversized;
      case "trending":
      default:
        return trending.slice(0, 8);
    }
  }, [activeFeedTab, newDrops, deals, oversized, trending]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const moveSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  const handleCopyCoupon = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      showToast(`Coupon code "${code}" copied to clipboard!`);
      setTimeout(() => setCopiedCoupon(false), 2200);
    }
  };

  return (
    <>
      {/* Mobile-first Stories / Category Capsules */}
      <section className="mobile-story-strip" aria-label="Browse categories">
        <div className="mobile-story-rail">
          {homeCategories.map((category) => (
            <Link href={category.href} className="mobile-story-item" key={category.label}>
              <span className={`mobile-story-avatar mobile-story-avatar--${category.tone}`} aria-hidden="true">
                <img src={category.image} alt={category.label} className="mobile-story-photo" referrerPolicy="no-referrer" />
              </span>
              <span className="mobile-story-label">{category.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Hero Carousel */}
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Featured collections"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(delta) > 50) moveSlide(delta > 0 ? -1 : 1);
          touchStart.current = null;
        }}
      >
        <div className="hero-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {heroSlides.map((slide, index) => (
            <article
              className="hero-slide"
              key={slide.title}
              aria-hidden={activeSlide !== index}
              style={{ "--hero-main": slide.palette[0], "--hero-accent": slide.palette[1], "--hero-ink": slide.palette[2] } as React.CSSProperties}
            >
              <div className="hero-copy">
                <p className="hero-kicker"><Sparkles size={15} aria-hidden="true" /> {slide.kicker}</p>
                <h1>{slide.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
                <p>{slide.copy}</p>
                <Link href={slide.href} className="button button--ink" tabIndex={activeSlide === index ? 0 : -1}>
                  {slide.cta} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
              <div className="hero-art"><HeroArtwork slide={slide} /></div>
            </article>
          ))}
        </div>
        <button type="button" className="hero-arrow hero-arrow--prev" onClick={() => moveSlide(-1)} aria-label="Previous hero slide"><ChevronLeft /></button>
        <button type="button" className="hero-arrow hero-arrow--next" onClick={() => moveSlide(1)} aria-label="Next hero slide"><ChevronRight /></button>
        <div className="hero-dots" role="tablist" aria-label="Choose a hero slide">
          {heroSlides.map((slide, index) => (
            <button key={slide.kicker} type="button" role="tab" aria-selected={activeSlide === index} aria-label={`Show slide ${index + 1}`} onClick={() => setActiveSlide(index)}>
              <span style={{ transform: activeSlide === index && !paused ? "scaleX(1)" : "scaleX(0)" }} />
            </button>
          ))}
        </div>
      </section>

      {/* Mobile In-App Coupon Ticker */}
      <div className="mobile-coupon-strip shell">
        <button
          type="button"
          className="mobile-coupon-btn"
          onClick={() => handleCopyCoupon("MI10")}
          aria-label="Copy coupon code MI10 for 10% off"
        >
          <span className="mobile-coupon-tag">
            <Tag size={15} aria-hidden="true" />
            <span>EXTRA 10% OFF · CODE: <b>MI10</b></span>
          </span>
          <span className="mobile-coupon-action">
            {copiedCoupon ? (
              <>
                <Check size={14} aria-hidden="true" /> COPIED
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" /> TAP TO COPY
              </>
            )}
          </span>
        </button>
      </div>

      {/* Mobile Interactive Feed Tabs */}
      <section className="mobile-feed-section shell" aria-label="Quick browse styles">
        <div className="mobile-feed-tabs" role="tablist" aria-label="Product categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "trending"}
            className={`mobile-feed-tab ${activeFeedTab === "trending" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("trending")}
          >
            🔥 Trending
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "new"}
            className={`mobile-feed-tab ${activeFeedTab === "new" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("new")}
          >
            ✨ New Drops
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "deals"}
            className={`mobile-feed-tab ${activeFeedTab === "deals" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("deals")}
          >
            🏷️ Under ₹799
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeFeedTab === "oversized"}
            className={`mobile-feed-tab ${activeFeedTab === "oversized" ? "is-active" : ""}`}
            onClick={() => setActiveFeedTab("oversized")}
          >
            👕 Oversized
          </button>
        </div>

        <div className="product-grid product-grid--mobile-feed">
          {activeFeedProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>

        <div className="mobile-view-all-wrap">
          <Link href="/shop" className="mobile-view-all-btn">
            Explore all styles in shop <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Desktop Category Rail */}
      <section className="page-shell home-section category-section desktop-only-section" aria-labelledby="category-title">
        <SectionHeading eyebrow="Find your thing" title="SHOP BY CATEGORY" href="/shop" />
        <div className="category-rail" id="category-title">
          {homeCategories.map((category) => (
            <Link href={category.href} className="category-bubble" key={category.label}>
              <span className={`category-bubble__art category-bubble__art--${category.tone}`} aria-hidden="true">
                <img src={category.image} alt={category.label} className="category-bubble__photo" referrerPolicy="no-referrer" />
              </span>
              <strong>{category.label}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell home-section">
        <SectionHeading eyebrow="Crowd favourites" title="TRENDING RIGHT NOW" href="/shop?sort=popular" />
        <div className="product-rail">
          {trending.map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
      </section>

      <section className="page-shell home-section">
        <div className="editorial-grid">
          {editorials.map((editorial) => (
            <Link href={editorial.href} className={`editorial-card ${editorial.className}`} key={editorial.title}>
              <img src={editorial.image} alt={editorial.title} className="editorial-card__bg-image" referrerPolicy="no-referrer" />
              <div className="editorial-card__art" aria-hidden="true">
                <span>{editorial.art}</span>
                <i /><b />
              </div>
              <div className="editorial-card__copy">
                <p>{editorial.overline}</p>
                <h3>{editorial.title}</h3>
                <span>{editorial.copy} <ArrowRight size={17} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-shell home-section">
        <SectionHeading eyebrow="Just landed" title="NEW DROPS" href="/shop?sort=newest" linkLabel="Shop new" />
        <div className="product-grid product-grid--home">
          {newDrops.map((product) => <ProductCard product={product} key={product.id} />)}
        </div>
      </section>

      <section className="usp-strip" aria-label="Shopping benefits">
        <div className="page-shell usp-strip__inner">
          <div><Truck aria-hidden="true" /><span><strong>Free shipping</strong><small>On orders above ₹999</small></span></div>
          <div><RotateCcw aria-hidden="true" /><span><strong>Easy returns</strong><small>30 days, no drama</small></span></div>
          <div><WalletCards aria-hidden="true" /><span><strong>Pay your way</strong><small>UPI, cards & COD</small></span></div>
          <div><ShieldCheck aria-hidden="true" /><span><strong>Secure checkout</strong><small>Protected every time</small></span></div>
        </div>
      </section>

      <section className="page-shell home-section">
        <SectionHeading eyebrow="Big mood, small price" title="UNDER ₹799" href="/shop?maxPrice=799" />
        <div className="product-rail">
          {deals.map((product) => <ProductCard product={product} key={product.id} compact />)}
        </div>
      </section>

      <section className="page-shell home-section home-section--last">
        <SectionHeading eyebrow="Eight worlds. One wardrobe." title="SHOP THE COLLECTIONS" href="/shop" />
        <div className="collection-grid">
          {collectionTiles.map(([title, copy, slug, tone], index) => (
            <Link href={`/shop?collection=${slug}`} className={`collection-tile ${tone}`} key={slug}>
              <span className="collection-tile__index">0{index + 1}</span>
              <div className="collection-tile__motif" aria-hidden="true"><i /><b /><em /></div>
              <div><h3>{title}</h3><p>{copy}</p></div>
              <ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
