import { ListingsGridSkeleton } from "@/components/listings/ListingCardSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="skeleton-shimmer mb-8 h-40 rounded-3xl" />
      <ListingsGridSkeleton />
    </div>
  );
}
