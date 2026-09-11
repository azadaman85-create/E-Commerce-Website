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
  title: "Women",
  description:
    "The women's collection — silk, cashmere, cotton poplin and coats cut to last.",
  alternates: { canonical: absoluteUrl("/women") },
};

export default function WomenPage({
  searchParams,
}: {
  searchParams: CatalogueSearchParams;
}) {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-12">
        <span className="label-caps">Women</span>
        <h1 className="mt-3 font-serif text-section-sm leading-tight text-ink md:text-section">
          The Women&rsquo;s Collection
        </h1>
        <p className="mt-4 max-w-xl text-body leading-relaxed text-muted">
          Silk, cashmere and cotton poplin — pieces that do the work of five.
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
        <CatalogueView gender="women" searchParams={searchParams} basePath="/women" />
      </Suspense>
    </div>
  );
}
