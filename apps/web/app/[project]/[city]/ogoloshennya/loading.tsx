import { ListingsGridSkeleton } from "@/components/listings/ListingCardSkeleton";

export default function Loading() {
  return (
    <div className="pb-nav md:pb-8">
      <div className="skeleton-shimmer mx-4 mt-4 h-44 rounded-3xl md:mx-4" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ListingsGridSkeleton />
      </div>
    </div>
  );
}
