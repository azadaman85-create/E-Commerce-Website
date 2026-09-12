"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Product } from "@/lib/types";

const CatalogContext = createContext<Product[] | null>(null);

/**
 * Holds the catalogue fetched on the server in app/layout.tsx. The value is a
 * stable reference for the life of the page, so components can keep using
 * `useMemo(..., [])` over it exactly as they did with the old static import.
 */
export function CatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  return <CatalogContext.Provider value={products}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Product[] {
  const products = useContext(CatalogContext);

  if (!products) {
    throw new Error("useCatalog must be used inside CatalogProvider");
  }

  return products;
}
