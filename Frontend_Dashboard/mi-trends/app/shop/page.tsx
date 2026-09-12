"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { products } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

type SortKey = "popular" | "newest" | "price-asc" | "price-desc" | "discount" | "rating";

const priceBands = [
  { label: "Under ₹799", min: 0, max: 799 },
  { label: "₹800 – ₹1,199", min: 800, max: 1199 },
  { label: "₹1,200 – ₹1,799", min: 1200, max: 1799 },
  { label: "₹1,800 & above", min: 1800, max: Infinity },
];

const sortLabels: Record<SortKey, string> = {
  popular: "Most popular",
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  discount: "Best discount",
  rating: "Top rated",
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function ShopContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const initialCategory = (searchParams.get("category") || searchParams.get("gender") || "").toLowerCase();
  const initialCollection = searchParams.get("collection") || "";
  const initialTag = (searchParams.get("tag") || "").toLowerCase();

  const [sort, setSort] = useState<SortKey>("popular");
  const [types, setTypes] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>(initialCollection ? [initialCollection] : []);
  const [sizes, setSizes] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const productTypes = useMemo(() => [...new Set(products.map((product) => product.type))], []);
  const collectionNames = useMemo(() => [...new Set(products.map((product) => product.collection))], []);
  const allSizes = useMemo(() => {
    const preferred = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "UK6", "UK7", "UK8", "UK9", "UK10", "UK11", "Free size"];
    const available = new Set(products.flatMap((product) => product.sizes));
    return preferred.filter((size) => available.has(size));
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => event.key === "Escape" && setFilterOpen(false);
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [filterOpen]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const selectedPrice = priceBand === null ? null : priceBands[priceBand];
    const list = products.filter((product) => {
      const searchable = `${product.name} ${product.collection} ${product.type} ${product.art}`.toLowerCase();
      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
      if (initialCategory && initialCategory !== "all" && product.category !== initialCategory && product.category !== "unisex") return false;
      if (initialTag === "new" && !product.tags.includes("new")) return false;
      if (initialTag === "sale" && product.discount <= 0) return false;
      if (types.length && !types.includes(product.type)) return false;
      if (collections.length && !collections.some((item) => item.toLowerCase() === product.collection.toLowerCase() || item === product.collectionSlug)) return false;
      if (sizes.length && !sizes.some((size) => product.sizes.includes(size))) return false;
      if (selectedPrice && (product.price < selectedPrice.min || product.price > selectedPrice.max)) return false;
      if (discount !== null && product.discount < discount) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "newest") return Number(b.tags.includes("new")) - Number(a.tags.includes("new")) || b.id - a.id;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "discount") return b.discount - a.discount;
      if (sort === "rating") return b.rating - a.rating;
      return b.popularity - a.popularity;
    });
  }, [query, initialCategory, initialTag, types, collections, sizes, priceBand, discount, sort]);

  const clearAll = () => {
    setTypes([]);
    setCollections([]);
    setSizes([]);
    setPriceBand(null);
    setDiscount(null);
  };
  const filterCount = types.length + collections.length + sizes.length + Number(priceBand !== null) + Number(discount !== null);
  const title = query
    ? `Results for “${query}”`
    : initialTag === "sale"
      ? "The sale edit"
      : initialTag === "new"
        ? "New arrivals"
        : initialCategory
          ? `${initialCategory[0].toUpperCase()}${initialCategory.slice(1)}'s edit`
          : "Shop all";

  const renderFilterPanel = (mobile = false) => (
    <div className={`filter-panel ${mobile ? "filter-panel--mobile" : ""}`}>
      {mobile && (
        <div className="filter-head">
          <div><span>Refine your edit</span><strong>Filters</strong></div>
          <button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)}><X size={21} /></button>
        </div>
      )}
      <div className="filter-title">
        <span>Filters</span>
        {filterCount > 0 && <button type="button" onClick={clearAll}>Clear all</button>}
      </div>

      <details open>
        <summary>Product type <ChevronDown size={15} /></summary>
        <div className="check-list">
          {productTypes.map((type) => {
            const count = products.filter((product) => product.type === type).length;
            return (
              <label key={type}>
                <input type="checkbox" checked={types.includes(type)} onChange={() => setTypes(toggleValue(types, type))} />
                <span>{type}</span><small>{count}</small>
              </label>
            );
          })}
        </div>
      </details>

      <details open>
        <summary>Size <ChevronDown size={15} /></summary>
        <div className="size-list">
          {allSizes.map((size) => (
            <button key={size} type="button" className={sizes.includes(size) ? "active" : ""} onClick={() => setSizes(toggleValue(sizes, size))}>{size}</button>
          ))}
        </div>
      </details>

      <details>
        <summary>Price <ChevronDown size={15} /></summary>
        <div className="check-list radio-list">
          {priceBands.map((band, index) => (
            <label key={band.label}>
              <input type="radio" name={mobile ? "mobile-price" : "desktop-price"} checked={priceBand === index} onChange={() => setPriceBand(index)} />
              <span>{band.label}</span>
            </label>
          ))}
        </div>
      </details>

      <details>
        <summary>Collection <ChevronDown size={15} /></summary>
        <div className="check-list">
          {collectionNames.map((collection) => (
            <label key={collection}>
              <input type="checkbox" checked={collections.includes(collection)} onChange={() => setCollections(toggleValue(collections, collection))} />
              <span>{collection}</span>
            </label>
          ))}
        </div>
      </details>

      <details>
        <summary>Discount <ChevronDown size={15} /></summary>
        <div className="check-list radio-list">
          {[10, 20, 30, 40].map((value) => (
            <label key={value}>
              <input type="radio" name={mobile ? "mobile-discount" : "desktop-discount"} checked={discount === value} onChange={() => setDiscount(value)} />
              <span>{value}% and above</span>
            </label>
          ))}
        </div>
      </details>

      {mobile && (
        <div className="filter-actions">
          <button type="button" className="filter-clear" onClick={clearAll}>Clear all</button>
          <button type="button" className="filter-apply" onClick={() => setFilterOpen(false)}>Show {filtered.length} styles</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="shop-page">
      <div className="shop-crumb"><Link href="/">Home</Link><span>/</span><span>Shop</span></div>
      <header className="shop-hero">
        <div>
          <span className="eyebrow">Curated for right now</span>
          <h1>{title}</h1>
          <p>{filtered.length} original styles, designed for everyday main-character energy.</p>
        </div>
        <div className="sort-wrap">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </header>

      {filterCount > 0 && (
        <div className="applied" aria-label="Applied filters">
          <span>Applied</span>
          {types.map((value) => <button key={value} onClick={() => setTypes(types.filter((item) => item !== value))}>{value}<X size={13} /></button>)}
          {collections.map((value) => <button key={value} onClick={() => setCollections(collections.filter((item) => item !== value))}>{value}<X size={13} /></button>)}
          {sizes.map((value) => <button key={value} onClick={() => setSizes(sizes.filter((item) => item !== value))}>{value}<X size={13} /></button>)}
          {priceBand !== null && <button onClick={() => setPriceBand(null)}>{priceBands[priceBand].label}<X size={13} /></button>}
          {discount !== null && <button onClick={() => setDiscount(null)}>{discount}%+ off<X size={13} /></button>}
        </div>
      )}

      <div className="mobile-toolbar">
        <button type="button" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={17} />Filters{filterCount > 0 && <b>{filterCount}</b>}</button>
        <div className="mobile-sort">
          <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <ChevronDown size={15} />
        </div>
      </div>

      <div className="shop-body">
        <aside>{renderFilterPanel(false)}</aside>
        <section aria-live="polite">
          {filtered.length ? (
            <div className="product-grid">
              {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty-state">
              <span>Nothing hiding here</span>
              <h2>Try a wider mix.</h2>
              <p>Remove a filter or browse every MI TRENDS piece to get back in the flow.</p>
              <button type="button" onClick={clearAll}>Reset filters</button>
            </div>
          )}
        </section>
      </div>

      {filterOpen && (
        <div className="filter-scrim" onMouseDown={(event) => event.target === event.currentTarget && setFilterOpen(false)}>
          {renderFilterPanel(true)}
        </div>
      )}

      <style jsx>{`
        .shop-page { width: min(1400px, calc(100% - 48px)); margin: 0 auto; padding: 28px 0 90px; color: #171717; }
        .shop-crumb { display: flex; gap: 8px; align-items: center; color: #77716a; font-size: 12px; margin-bottom: 34px; }
        .shop-crumb a { color: inherit; text-decoration: none; }
        .shop-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; padding-bottom: 28px; border-bottom: 1px solid #dedbd5; }
        .eyebrow { color: #e84a2a; font-size: 11px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        h1 { max-width: 850px; margin: 8px 0 8px; font-size: clamp(36px, 5vw, 68px); line-height: .94; letter-spacing: -.055em; text-transform: uppercase; }
        .shop-hero p { margin: 0; color: #69645e; font-size: 14px; }
        .sort-wrap { position: relative; flex: 0 0 232px; }
        .sort-wrap label { display: block; margin-bottom: 7px; font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .sort-wrap select, .mobile-sort select { width: 100%; appearance: none; border: 1px solid #d8d4cd; background: #fff; color: #171717; border-radius: 6px; min-height: 48px; padding: 0 42px 0 14px; font: inherit; cursor: pointer; }
        .sort-wrap > :global(svg), .mobile-sort > :global(svg) { pointer-events: none; position: absolute; right: 14px; bottom: 16px; }
        .shop-body { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 32px; padding-top: 28px; }
        aside { align-self: stretch; }
        .filter-panel { position: sticky; top: 118px; }
        .filter-title { display: flex; justify-content: space-between; align-items: center; min-height: 42px; }
        .filter-title span { font-size: 13px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .filter-title button { border: 0; background: none; color: #e4482a; font-size: 12px; font-weight: 700; cursor: pointer; }
        details { border-top: 1px solid #dedbd5; padding: 2px 0; }
        details:last-of-type { border-bottom: 1px solid #dedbd5; }
        summary { display: flex; align-items: center; justify-content: space-between; min-height: 54px; list-style: none; cursor: pointer; font-size: 12px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
        summary::-webkit-details-marker { display: none; }
        details[open] summary :global(svg) { transform: rotate(180deg); }
        .check-list { display: grid; gap: 13px; max-height: 250px; overflow: auto; padding: 4px 3px 18px; }
        .check-list label { display: flex; align-items: center; gap: 10px; color: #4f4b47; font-size: 13px; cursor: pointer; }
        .check-list input { accent-color: #171717; width: 16px; height: 16px; }
        .check-list small { margin-left: auto; color: #96918a; }
        .size-list { display: flex; flex-wrap: wrap; gap: 7px; padding: 3px 0 18px; }
        .size-list button { min-width: 42px; min-height: 36px; padding: 0 9px; border: 1px solid #d9d5ce; background: #fff; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer; }
        .size-list button.active { border-color: #171717; background: #171717; color: white; }
        .product-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 34px 15px; }
        .applied { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 18px; }
        .applied > span { margin-right: 4px; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .applied button { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #d9d5ce; background: #f5f3ef; border-radius: 999px; min-height: 32px; padding: 0 11px; font-size: 11px; cursor: pointer; }
        .empty-state { min-height: 480px; display: grid; place-content: center; justify-items: center; text-align: center; background: #f4f2ee; border-radius: 10px; padding: 30px; }
        .empty-state span { color: #e4482a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .11em; }
        .empty-state h2 { margin: 8px 0; font-size: clamp(30px, 5vw, 54px); letter-spacing: -.05em; text-transform: uppercase; }
        .empty-state p { max-width: 440px; margin: 0 0 22px; color: #68635d; line-height: 1.6; }
        .empty-state button { border: 0; border-radius: 5px; min-height: 48px; padding: 0 24px; background: #171717; color: #fff; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; cursor: pointer; }
        .mobile-toolbar, .filter-scrim { display: none; }
        button:focus-visible, select:focus-visible, input:focus-visible, summary:focus-visible, a:focus-visible { outline: 3px solid #f3a078; outline-offset: 2px; }
        @media (max-width: 1180px) { .product-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
        @media (max-width: 900px) {
          .shop-page { width: min(100% - 32px, 1400px); padding-top: 22px; }
          .shop-hero { align-items: flex-start; }
          .sort-wrap, .shop-body > aside { display: none; }
          .shop-body { display: block; padding-top: 18px; }
          .mobile-toolbar { display: grid; grid-template-columns: 1fr 1fr; margin-top: 18px; border: 1px solid #d9d5ce; border-radius: 6px; overflow: hidden; }
          .mobile-toolbar > button { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; border: 0; border-right: 1px solid #d9d5ce; background: #fff; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .mobile-toolbar b { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 99px; background: #e4482a; color: #fff; }
          .mobile-sort { position: relative; }
          .mobile-sort select { min-height: 48px; border: 0; border-radius: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; text-align: center; }
          .mobile-sort > :global(svg) { bottom: 16px; }
          .filter-scrim { position: fixed; inset: 0; z-index: 1000; display: flex; justify-content: flex-end; background: rgba(10,10,10,.5); }
          .filter-panel--mobile { position: relative; top: auto; width: min(420px, 92vw); height: 100%; overflow-y: auto; background: #fff; padding: 0 22px 100px; box-shadow: -20px 0 50px rgba(0,0,0,.18); animation: slide-in .22s ease-out; }
          .filter-head { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; min-height: 84px; margin: 0 -22px 8px; padding: 0 22px; border-bottom: 1px solid #ddd8d1; background: #fff; }
          .filter-head div { display: grid; gap: 3px; }
          .filter-head span { color: #e4482a; font-size: 10px; text-transform: uppercase; letter-spacing: .1em; font-weight: 800; }
          .filter-head strong { font-size: 24px; text-transform: uppercase; letter-spacing: -.03em; }
          .filter-head button { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid #ddd8d1; border-radius: 50%; background: #fff; }
          .filter-panel--mobile > .filter-title { display: none; }
          .filter-actions { position: fixed; right: 0; bottom: 0; width: min(420px, 92vw); display: grid; grid-template-columns: .8fr 1.3fr; gap: 9px; padding: 13px 16px calc(13px + env(safe-area-inset-bottom)); border-top: 1px solid #ddd8d1; background: #fff; }
          .filter-actions button { min-height: 48px; border-radius: 5px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
          .filter-clear { border: 1px solid #171717; background: #fff; }
          .filter-apply { border: 1px solid #171717; background: #171717; color: #fff; }
        }
        @media (max-width: 620px) {
          .shop-page { width: calc(100% - 24px); padding-bottom: 60px; }
          .shop-crumb { margin-bottom: 24px; }
          .shop-hero { padding-bottom: 20px; }
          .shop-hero p { line-height: 1.5; }
          .product-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 26px 8px; }
          .applied { flex-wrap: nowrap; overflow-x: auto; margin-right: -12px; padding-bottom: 2px; scrollbar-width: none; }
          .applied button { flex: none; }
        }
        @keyframes slide-in { from { transform: translateX(30px); opacity: .7; } }
        @media (prefers-reduced-motion: reduce) { .filter-panel--mobile { animation: none; } }
      `}</style>
    </div>
  );
}

export default function ShopPage() {
  return <Suspense fallback={<div style={{ minHeight: "60vh" }} />}><ShopContent /></Suspense>;
}
