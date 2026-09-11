import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { SearchAgain } from "@/components/storefront/SearchAgain";
import { getRatingsFor, listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the MI TRENDS collection.",
  robots: { index: false },
};

async function SearchResults({ query }: { query: string }) {
  const { products, total } = await listProducts({
    search: query,
    perPage: 24,
    sort: "newest",
  });

  const ratingMap = await getRatingsFor(products.map((p) => p.id));

  if (products.length === 0) {
    return (
      <EmptyState
        illustration="search"
        title={`Nothing found for “${query}”`}
        description="Try a different term, or browse the full collection."
        action={
          <ButtonLink href="/products" variant="dark">
            Browse all products
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <p className="mb-8 text-body-sm text-muted">
        {total} result{total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </p>
      <ProductGrid
        products={products}
        ratings={Object.fromEntries(ratingMap)}
        priorityCount={4}
      />
    </>
  );
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim();

  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10">
        <span className="label-caps">Search</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          {query ? `Results for “${query}”` : "Search products"}
        </h1>
      </header>

      <div className="mb-12 max-w-xl">
        <SearchAgain initialQuery={query} />
      </div>

      {query.length < 2 ? (
        <EmptyState
          illustration="search"
          title="What are you looking for?"
          description="Enter at least two characters to search the collection."
          action={
            <ButtonLink href="/products" variant="dark">
              Browse all products
            </ButtonLink>
          }
        />
      ) : (
        <Suspense key={query} fallback={<ProductGridSkeleton count={8} />}>
          <SearchResults query={query} />
        </Suspense>
      )}
    </div>
  );
}
