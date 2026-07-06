export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="skeleton-shimmer aspect-[16/10] w-full" />
      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <div className="skeleton-shimmer h-5 w-16 rounded-full" />
          <div className="skeleton-shimmer h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded" />
        <div className="skeleton-shimmer mt-4 h-5 w-2/5 rounded" />
      </div>
    </div>
  );
}

export function ListingsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 pb-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
