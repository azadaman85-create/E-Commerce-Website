"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { backdropVariants, EASE_TACTILE } from "@/lib/motion";
import { useDebounce, useLockBodyScroll, useRecentSearches } from "@/hooks";
import { useCurrency } from "@/context/SettingsContext";
import { Skeleton } from "@/components/ui/Skeleton";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
  categoryName: string | null;
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const formatCurrency = useCurrency();
  const { recent, push, clear } = useRecentSearches();

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounced = useDebounce(term, 250);
  const inputRef = useRef<HTMLInputElement>(null);

  useLockBodyScroll(open);

  useEffect(() => {
    if (open) {
      // Focus after the entrance animation has begun, or iOS drops it.
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    setTerm("");
    setResults([]);
    setActiveIndex(-1);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const query = debounced.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { results: [] }))
      .then((data: { results: SearchResult[] }) => {
        setResults(data.results ?? []);
        setActiveIndex(-1);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setResults([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced, open]);

  const go = useCallback(
    (slug: string, searchTerm: string) => {
      push(searchTerm);
      onClose();
      router.push(`/products/${slug}`);
    },
    [push, onClose, router],
  );

  const submit = useCallback(() => {
    const query = term.trim();
    if (!query) return;
    push(query);
    onClose();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [term, push, onClose, router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        go(results[activeIndex].slug, term);
      } else {
        submit();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95]">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_TACTILE }}
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="relative z-10 w-full bg-white shadow-card-hover"
          >
            <div className="container-page py-6">
              <div className="flex items-center gap-4 border-b border-hairline pb-4">
                <Search className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                <input
                  ref={inputRef}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search for products…"
                  aria-label="Search products"
                  aria-autocomplete="list"
                  className="w-full bg-transparent font-serif text-2xl text-ink outline-none placeholder:text-ink/25 md:text-4xl"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="shrink-0 cursor-pointer rounded-sm p-2 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pt-6">
                {loading && (
                  <div className="flex flex-col gap-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-16 w-14 shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="mb-2 h-4 w-1/3" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && term.trim().length >= 2 && results.length === 0 && (
                  <p className="py-8 text-center text-body-sm text-muted">
                    No products match &ldquo;{term.trim()}&rdquo;.
                  </p>
                )}

                {!loading && results.length > 0 && (
                  <ul role="listbox" className="flex flex-col">
                    {results.map((result, i) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={i === activeIndex}
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => go(result.slug, term)}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-4 rounded-sm p-3 text-left transition-colors",
                            i === activeIndex ? "bg-cream" : "hover:bg-cream/60",
                          )}
                        >
                          <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-cream">
                            {result.imageUrl && (
                              <Image
                                src={result.imageUrl}
                                alt=""
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {result.categoryName && (
                              <span className="label-caps">{result.categoryName}</span>
                            )}
                            <p className="truncate font-serif text-lg text-ink">
                              {result.title}
                            </p>
                          </div>
                          <span className="shrink-0 text-body-sm text-ink">
                            {formatCurrency(result.salePrice ?? result.price)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!loading && term.trim().length < 2 && recent.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="label-caps">Recent searches</span>
                      <button
                        type="button"
                        onClick={clear}
                        className="cursor-pointer text-caption normal-case tracking-normal text-muted underline transition-colors hover:text-ink"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setTerm(item)}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-hairline px-4 py-2 text-body-sm text-muted transition-colors hover:border-ink/25 hover:text-ink"
                        >
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
