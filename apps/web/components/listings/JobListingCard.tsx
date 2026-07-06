import Link from "next/link";
import type { PublicListingSummary } from "@/lib/listings-types";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

interface Props {
  listing: PublicListingSummary;
  project: string;
}

export function JobListingCard({ listing, project }: Props) {
  const title = listing.title ?? listing.firstVacancyTitle ?? "Вакансія";
  const date = formatDate(listing.publishedAt);

  return (
    <Link
      href={`/${project}/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition active:scale-[0.99] hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
    >
      <div className="relative flex items-start gap-3 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50/80 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
          💼
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand">
            {title}
          </h3>
          {listing.businessType && (
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{listing.businessType}</p>
          )}
        </div>
        {listing.vacancyCount > 1 && (
          <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
            {listing.vacancyCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {listing.firstVacancyTitle && listing.title && (
          <p className="line-clamp-2 text-sm text-slate-600">
            <span className="text-slate-400">потрібен:</span> {listing.firstVacancyTitle}
            {listing.vacancyCount > 1 ? ` +${listing.vacancyCount - 1}` : ""}
          </p>
        )}

        {listing.address && (
          <p className="line-clamp-1 text-sm text-slate-500">📍 {listing.address}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {listing.cityName && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                {listing.cityName}
              </span>
            )}
            {date && <span>{date}</span>}
          </div>
          {listing.contactPhone && (
            <span className="text-sm font-semibold text-brand">📲 Звʼязатись</span>
          )}
        </div>
      </div>
    </Link>
  );
}
