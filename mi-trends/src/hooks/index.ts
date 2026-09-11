"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Delays a value until it has been stable for `delay` ms. */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** True once the window has scrolled past `threshold` px. */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Locks body scroll while `locked` is true. Used by drawers and modals. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

/** Animated count-up for KPI cards. Respects reduced-motion. */
export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(from + (target - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

const RECENT_SEARCH_KEY = "mitrends.recentSearches.v1";

export function useRecentSearches(limit = 5) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCH_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRecent(parsed.filter((x) => typeof x === "string"));
    } catch {
      setRecent([]);
    }
  }, []);

  const push = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setRecent((prev) => {
        const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, limit);
        try {
          localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
        } catch {
          // Storage unavailable — recents simply will not persist.
        }
        return next;
      });
    },
    [limit],
  );

  const clear = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_SEARCH_KEY);
    } catch {
      // no-op
    }
  }, []);

  return { recent, push, clear };
}

// useWishlist deliberately is NOT re-exported here. A static re-export still
// puts supabase-js in the graph of anything importing this barrel, which is
// how ~196 kB ended up on every page that used useScrolled.
// Import it directly: import { useWishlist } from "@/hooks/useWishlist";
