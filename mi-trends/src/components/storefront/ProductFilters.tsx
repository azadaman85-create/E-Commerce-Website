"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { cn, parseListParam } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";
import { PriceSlider } from "@/components/storefront/PriceSlider";
import { Checkbox } from "@/components/ui/Input";
import { Stars } from "@/components/ui/Stars";
import type { Category } from "@/types";

export interface FilterState {
  category: string;
  minPrice: number;
  maxPrice: number;
  sizes: string[];
  colours: string[];
  minRating: number;
  inStock: boolean;
  sort: string;
}

interface ProductFiltersProps {
  categories: Category[];
  sizes: string[];
  colours: string[];
  priceBounds: { min: number; max: number };
  total: number;
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "best-selling", label: "Best selling" },
  { value: "rating", label: "Highest rated" },
];

export function readFilters(
  params: URLSearchParams,
  bounds: { min: number; max: number },
): FilterState {
  return {
    category: params.get("category") ?? "",
    minPrice: Number(params.get("minPrice") ?? bounds.min),
    maxPrice: Number(params.get("maxPrice") ?? bounds.max),
    sizes: parseListParam(params.get("sizes")),
    colours: parseListParam(params.get("colours")),
    minRating: Number(params.get("minRating") ?? 0),
    inStock: params.get("inStock") === "1",
    sort: params.get("sort") ?? "newest",
  };
}

export function ProductFilters({
  categories,
  sizes,
  colours,
  priceBounds,
  total,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = useMemo(
    () => readFilters(new URLSearchParams(searchParams.toString()), priceBounds),
    [searchParams, priceBounds],
  );

  // Local price state so dragging feels immediate; the URL only updates on release.
  const [priceDraft, setPriceDraft] = useState<[number, number]>([
    filters.minPrice,
    filters.maxPrice,
  ]);

  useEffect(() => {
    setPriceDraft([filters.minPrice, filters.maxPrice]);
  }, [filters.minPrice, filters.maxPrice]);

  /** Writes a filter change into the URL — this is what makes filters shareable. */
  const apply = useCallback(
    (patch: Partial<FilterState>) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged = { ...filters, ...patch };

      const setOrDelete = (key: string, value: string) => {
        if (value) next.set(key, value);
        else next.delete(key);
      };

      setOrDelete("category", merged.category);
      setOrDelete("sizes", merged.sizes.join(","));
      setOrDelete("colours", merged.colours.join(","));
      setOrDelete("minRating", merged.minRating > 0 ? String(merged.minRating) : "");
      setOrDelete("inStock", merged.inStock ? "1" : "");
      setOrDelete("sort", merged.sort !== "newest" ? merged.sort : "");
      setOrDelete(
        "minPrice",
        merged.minPrice > priceBounds.min ? String(merged.minPrice) : "",
      );
      setOrDelete(
        "maxPrice",
        merged.maxPrice < priceBounds.max ? String(merged.maxPrice) : "",
      );

      // Any filter change resets pagination.
      next.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [filters, searchParams, pathname, router, priceBounds],
  );

  const toggleInList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];

    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      chips.push({
        key: `cat-${filters.category}`,
        label: cat?.name ?? filters.category,
        clear: () => apply({ category: "" }),
      });
    }
    for (const size of filters.sizes) {
      chips.push({
        key: `size-${size}`,
        label: `Size ${size}`,
        clear: () => apply({ sizes: filters.sizes.filter((s) => s !== size) }),
      });
    }
    for (const colour of filters.colours) {
      chips.push({
        key: `colour-${colour}`,
        label: colour,
        clear: () => apply({ colours: filters.colours.filter((c) => c !== colour) }),
      });
    }
    if (filters.minRating > 0) {
      chips.push({
        key: "rating",
        label: `${filters.minRating}★ & up`,
        clear: () => apply({ minRating: 0 }),
      });
    }
    if (filters.inStock) {
      chips.push({
        key: "stock",
        label: "In stock",
        clear: () => apply({ inStock: false }),
      });
    }
    if (filters.minPrice > priceBounds.min || filters.maxPrice < priceBounds.max) {
      chips.push({
        key: "price",
        label: "Price range",
        clear: () => apply({ minPrice: priceBounds.min, maxPrice: priceBounds.max }),
      });
    }

    return chips;
  }, [filters, categories, apply, priceBounds]);

  const clearAll = () => {
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  const groupHeading = "text-caption uppercase tracking-[0.1em] text-ink";

  const panel = (
    <div className="flex flex-col gap-10">
      <div>
        <h3 className={groupHeading}>Category</h3>
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => apply({ category: "" })}
            className={cn(
              "cursor-pointer text-left text-body-sm transition-colors",
              !filters.category ? "text-accent" : "text-muted hover:text-ink",
            )}
          >
            All products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => apply({ category: category.slug })}
              className={cn(
                "cursor-pointer text-left text-body-sm transition-colors",
                filters.category === category.slug
                  ? "text-accent"
                  : "text-muted hover:text-ink",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={groupHeading}>Price</h3>
        <div className="mt-5">
          <PriceSlider
            min={priceBounds.min}
            max={priceBounds.max}
            value={priceDraft}
            onChange={setPriceDraft}
            onCommit={([low, high]) => apply({ minPrice: low, maxPrice: high })}
          />
        </div>
      </div>

      {sizes.length > 0 && (
        <div>
          <h3 className={groupHeading}>Size</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => apply({ sizes: toggleInList(filters.sizes, size) })}
                aria-pressed={filters.sizes.includes(size)}
                className={cn(
                  "min-w-12 cursor-pointer rounded-sm border px-3 py-2 text-body-sm transition-all",
                  filters.sizes.includes(size)
                    ? "border-ink bg-ink text-white"
                    : "border-ink/15 text-ink hover:border-ink/45",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {colours.length > 0 && (
        <div>
          <h3 className={groupHeading}>Colour</h3>
          <div className="mt-4 flex flex-col gap-3">
            {colours.map((colour) => (
              <Checkbox
                key={colour}
                label={colour}
                checked={filters.colours.includes(colour)}
                onChange={() => apply({ colours: toggleInList(filters.colours, colour) })}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className={groupHeading}>Rating</h3>
        <div className="mt-4 flex flex-col gap-3">
          {[4, 3, 2].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => apply({ minRating: filters.minRating === rating ? 0 : rating })}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1 -mx-2 text-body-sm transition-colors",
                filters.minRating === rating ? "bg-cream text-ink" : "text-muted hover:text-ink",
              )}
            >
              <Stars rating={rating} size={14} />
              <span>&amp; up</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={groupHeading}>Availability</h3>
        <div className="mt-4">
          <Checkbox
            label="In stock only"
            checked={filters.inStock}
            onChange={(e) => apply({ inStock: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/*
        Toolbar: count, chips, sort, and the mobile filter trigger.
        Spans both columns so it sits above the sidebar and the grid rather
        than being squeezed into the 240px sidebar track.
      */}
      <div className="mb-8 flex flex-col gap-4 lg:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-body-sm text-muted" aria-live="polite">
            {isPending ? "Updating…" : `${total} product${total === 1 ? "" : "s"}`}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-sm border border-ink/15 px-4 text-caption uppercase tracking-[0.1em] transition-colors hover:border-ink/40 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              Filters
              {activeChips.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                  {activeChips.length}
                </span>
              )}
            </button>

            <div className="relative">
              <label htmlFor="sort" className="sr-only">
                Sort products
              </label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => apply({ sort: e.target.value })}
                className="h-10 cursor-pointer appearance-none rounded-sm border border-ink/15 bg-white pl-4 pr-9 text-body-sm text-ink outline-none transition-colors hover:border-ink/40 focus:border-accent"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence mode="popLayout">
              {activeChips.map((chip) => (
                <motion.button
                  key={chip.key}
                  layout
                  type="button"
                  onClick={chip.clear}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2, ease: EASE_TACTILE }}
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-caption normal-case tracking-normal text-ink transition-colors hover:bg-ink/8"
                >
                  {chip.label}
                  <X className="h-3 w-3" aria-hidden />
                </motion.button>
              ))}
            </AnimatePresence>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer px-2 text-caption normal-case tracking-normal text-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Desktop sidebar — grid column 1. */}
      <aside className="hidden lg:col-start-1 lg:block">{panel}</aside>

      {/* Mobile bottom sheet. */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="fixed inset-0 z-[88] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              aria-hidden
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-lg bg-white"
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-white px-6 py-4">
                <h2 className="text-label uppercase tracking-[0.1em]">Filters</h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="cursor-pointer rounded-sm p-2 text-muted hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="px-6 py-8">{panel}</div>
              <div className="sticky bottom-0 border-t border-hairline bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="cta-shimmer h-14 w-full rounded-sm text-label uppercase tracking-[0.1em] text-white"
                >
                  Show {total} result{total === 1 ? "" : "s"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
