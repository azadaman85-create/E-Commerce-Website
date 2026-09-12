import type { Product } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Loads the catalogue from the API. Called from the server component in
 * app/layout.tsx, so the browser gets a fully populated page on first paint
 * and every client component can keep reading `products` synchronously.
 *
 * `cache: "no-store"` means a product added in the admin panel shows up on
 * the next page load rather than whenever a cache happens to expire.
 */
export async function fetchCatalog(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/api/products`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Catalogue request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as Product[];
}
