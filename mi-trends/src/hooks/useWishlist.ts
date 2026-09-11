"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Wishlist backed by Supabase. Only meaningful for signed-in users —
 * callers should prompt for sign-in when `user` is null.
 */
export function useWishlist() {
  const { user } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  /**
   * Imported on demand rather than statically: the heart on a product card
   * renders the same either way on first paint, and a static import would put
   * supabase-js (~196 kB) on every page showing a product grid.
   */
  const getSupabase = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    return createClient();
  }, []);

  const load = useCallback(async () => {
    if (!user) {
      setProductIds(new Set());
      setLoading(false);
      return;
    }
    const supabase = await getSupabase();
    const { data } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id);
    setProductIds(
      new Set((data ?? []).map((r: { product_id: string }) => r.product_id)),
    );
    setLoading(false);
  }, [getSupabase, user]);

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

      const supabase = await getSupabase();
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
    [getSupabase, user, productIds],
  );

  return {
    productIds,
    loading,
    isSaved: (id: string) => productIds.has(id),
    toggle,
    reload: load,
  };
}
