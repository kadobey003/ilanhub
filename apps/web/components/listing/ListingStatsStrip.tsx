import type { ListingEngagement } from "@/lib/listings-types";

interface Props {
  engagement: ListingEngagement;
  isHoreca?: boolean;
}

export function ListingStatsStrip({ engagement, isHoreca }: Props) {
  const accent = isHoreca ? "text-amber-700" : "text-brand";

  return (
    <div className="mb-5 flex flex-wrap gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
      <span className="flex items-center gap-1.5 text-slate-600">
        <span aria-hidden>👁</span>
        <strong className={accent}>{engagement.views}</strong> переглядів
      </span>
      <span className="flex items-center gap-1.5 text-slate-600">
        <span aria-hidden>❤️</span>
        <strong className={accent}>{engagement.likes}</strong> вподобань
      </span>
      <span className="flex items-center gap-1.5 text-slate-600">
        <span aria-hidden>💬</span>
        <strong className={accent}>{engagement.comments.length}</strong>{" "}
        коментарів
      </span>
    </div>
  );
}
