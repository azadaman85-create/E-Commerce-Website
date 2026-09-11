import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CatalogueView,
  type CatalogueSearchParams,
} from "@/components/storefront/CatalogueView";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Collection",
  description: "Every piece we make, for men and women.",
  alternates: { canonical: absoluteUrl("/products") },
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: CatalogueSearchParams;
}) {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-12">
        <span className="label-caps">Everything</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          The Collection
        </h1>
        <p className="mt-4 max-w-xl text-body leading-relaxed text-muted">
          Every piece we make, across both the men&rsquo;s and women&rsquo;s ranges.
        </p>
      </header>

      <Suspense
        key={JSON.stringify(searchParams)}
        fallback={
          <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
            <div className="hidden lg:block" />
            <ProductGridSkeleton count={8} />
          </div>
        }
      >
        <CatalogueView searchParams={searchParams} basePath="/products" />
      </Suspense>
    </div>
  );
}
