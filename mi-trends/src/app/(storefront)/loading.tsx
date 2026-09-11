import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Route-level fallback so navigation never lands on blank space. */
export default function StorefrontLoading() {
  return (
    <div className="container-page py-12 md:py-16">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-12 w-80 max-w-full" />
      <div className="mt-12">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
