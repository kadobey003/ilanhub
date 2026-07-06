import Link from "next/link";
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
  const others = listings.filter((l) => l.id !== currentId).slice(0, 8);

  if (!others.length) return null;

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Інші оголошення
        </h2>
        <Link
          href={`/${project}`}
          className="text-xs font-medium text-brand hover:underline"
        >
          Усі →
        </Link>
      </div>

      <div className="space-y-3">
        {others.map((listing) => (
          <Link
            key={listing.id}
            href={`/${project}/listing/${listing.id}`}
            className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-brand/30 hover:shadow-md"
          >
            <Thumbnail src={listing.imageUrl} title={listing.title ?? "Заклад"} />
            <div className="min-w-0 flex-1 py-0.5">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-brand">
                {listing.title ?? listing.firstVacancyTitle ?? "Вакансія"}
              </p>
              {listing.firstVacancyTitle && listing.title && (
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                  {listing.firstVacancyTitle}
                </p>
              )}
              {listing.cityName && (
                <p className="mt-1 text-xs text-slate-400">📍 {listing.cityName}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
