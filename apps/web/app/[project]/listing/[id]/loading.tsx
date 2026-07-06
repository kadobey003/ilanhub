import { ListingsGridSkeleton } from "@/components/listings/ListingCardSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="skeleton-shimmer mb-6 h-8 w-48 rounded" />
      <div className="skeleton-shimmer mb-8 aspect-[16/10] rounded-2xl" />
      <ListingsGridSkeleton count={3} />
    </div>
  );
}
