"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

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

/**
 * Wishlist backed by Supabase. Only meaningful for signed-in users —
 * callers should prompt for sign-in when `user` is null.
 */
export function useWishlist() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProductIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id);
    setProductIds(new Set((data ?? []).map((r: { product_id: string }) => r.product_id)));
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (productId: string): Promise<"added" | "removed" | "unauthenticated"> => {
      if (!user) return "unauthenticated";

      const isSaved = productIds.has(productId);
      // Optimistic — reverted below if the write fails.
      setProductIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });

      const { error } = isSaved
        ? await supabase
            .from("wishlist")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId)
        : await supabase
            .from("wishlist")
            .insert({ user_id: user.id, product_id: productId });

      if (error) {
        setProductIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw error;
      }

      return isSaved ? "removed" : "added";
    },
    [supabase, user, productIds],
  );

  return {
    productIds,
    loading,
    isSaved: (id: string) => productIds.has(id),
    toggle,
    reload: load,
  };
}
