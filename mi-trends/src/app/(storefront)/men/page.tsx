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
  title: "Men",
  description:
    "The men's collection — Japanese shirting, Italian tailoring, merino knitwear and outerwear built to last.",
  alternates: { canonical: absoluteUrl("/men") },
};

export default function MenPage({
  searchParams,
}: {
  searchParams: CatalogueSearchParams;
}) {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-12">
        <span className="label-caps">Men</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          The Men&rsquo;s Collection
        </h1>
        <p className="mt-4 max-w-xl text-body leading-relaxed text-muted">
          Japanese shirting, Italian tailoring and outerwear that earns its keep.
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
        <CatalogueView gender="men" searchParams={searchParams} basePath="/men" />
      </Suspense>
    </div>
  );
}
