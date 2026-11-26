import { ProductCardSkeleton, Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
