import Link from "next/link";
import { projectAllListingsPath } from "@/lib/cities";
import type { PublicListingSummary } from "@/lib/listings-types";

interface Props {
  listings: PublicListingSummary[];
  project: string;
  currentId: string;
}

function Thumbnail({ src, title }: { src?: string | null; title: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 text-2xl">
      🍽
    </div>
  );
}

export function RelatedListingsSidebar({ listings, project, currentId }: Props) {
  if (!listings.length) return null;

  return (
    <aside className="horeca-detail-card space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Схожі оголошення
        </h2>
        <Link
          href={projectAllListingsPath(project)}
          className="text-xs font-medium text-amber-700 hover:underline"
        >
          Усі →
        </Link>
      </div>

      <div className="space-y-3">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/${project}/listing/${listing.id}`}
            className="group flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition hover:border-amber-200 hover:bg-white hover:shadow-md"
          >
            <Thumbnail src={listing.imageUrl} title={listing.title ?? "Заклад"} />
            <div className="min-w-0 flex-1 py-0.5">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-amber-700">
                {listing.title ?? listing.firstVacancyTitle ?? "Вакансія"}
              </p>
              {listing.firstVacancyTitle && listing.title && (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                  {listing.firstVacancyTitle}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                {listing.cityName && <span>📍 {listing.cityName}</span>}
                {listing.firstSalary && (
                  <span className="font-medium text-emerald-700">
                    {listing.firstSalary}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
