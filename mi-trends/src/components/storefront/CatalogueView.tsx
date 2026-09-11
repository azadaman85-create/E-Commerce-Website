import { ProductFilters } from "@/components/storefront/ProductFilters";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { LoadMore } from "@/components/storefront/LoadMore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import {
  getCategoriesForGender,
  getFilterOptions,
  getRatingsFor,
  listProducts,
} from "@/lib/queries";
import { parseListParam } from "@/lib/utils";
import type { Gender } from "@/types";

const PER_PAGE = 12;

export interface CatalogueSearchParams {
  [key: string]: string | string[] | undefined;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The shared product listing used by /products, /men and /women.
 *
 * `gender` comes from the route rather than the query string, so the section
 * a shopper is in cannot be filtered away by editing the URL.
 */
export async function CatalogueView({
  gender,
  searchParams,
  basePath,
}: {
  gender?: Gender;
  searchParams: CatalogueSearchParams;
  basePath: string;
}) {
  const page = Math.max(1, Number(single(searchParams.page) ?? 1) || 1);
  const sort = single(searchParams.sort) ?? "newest";

  const [categories, filterOptions] = await Promise.all([
    getCategoriesForGender(gender),
    getFilterOptions(gender),
  ]);

  const minPrice = single(searchParams.minPrice);
  const maxPrice = single(searchParams.maxPrice);

  const { products, total, priceBounds } = await listProducts({
    gender,
    category: single(searchParams.category),
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sizes: parseListParam(single(searchParams.sizes)),
    colours: parseListParam(single(searchParams.colours)),
    minRating: Number(single(searchParams.minRating) ?? 0),
    inStock: single(searchParams.inStock) === "1",
    sort,
    // Cumulative paging: "Load more" widens the window so results stay
    // server-rendered and the URL stays shareable.
    page: 1,
    perPage: page * PER_PAGE,
  });

  const ratingMap = await getRatingsFor(products.map((p) => p.id));
  const ratings = Object.fromEntries(ratingMap);
  const hasMore = products.length < total;

  return (
    /*
      Three grid children, not one: the toolbar spans both columns, the
      sidebar takes the 240px track, and the products take the rest. Nesting
      them inside a single wrapper put the entire page in the 240px column,
      which is what squashed the product cards.
    */
    <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ProductFilters
        categories={categories}
        sizes={filterOptions.sizes}
        colours={filterOptions.colours}
        priceBounds={priceBounds}
        total={total}
      />

      {/* min-w-0 lets the grid track shrink instead of overflowing. */}
      <div className="min-w-0 lg:col-start-2">
        {products.length === 0 ? (
          <EmptyState
            illustration="search"
            title="Nothing matches those filters"
            description="Try widening your price range or clearing a filter or two."
            action={
              <ButtonLink href={basePath} variant="dark">
                Clear filters
              </ButtonLink>
            }
          />
        ) : (
          <ProductGrid products={products} ratings={ratings} priorityCount={4} />
        )}

        {hasMore && (
          <LoadMore nextPage={page + 1} remaining={total - products.length} />
        )}
      </div>
    </div>
  );
}
