import Link from "next/link";
import { HorecaCoverImage } from "./HorecaCoverImage";
import type { PublicListingSummary } from "@/lib/listings-types";

interface Props {
  listing: PublicListingSummary;
  project: string;
}

export function HorecaListingCard({ listing, project }: Props) {
  const title = listing.title ?? "Заклад";

  return (
    <Link
      href={`/${project}/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-lg"
    >
      <HorecaCoverImage
        src={listing.imageUrl}
        title={title}
        sizes="card"
        className="rounded-none rounded-t-2xl"
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {listing.businessType && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-900">
              {listing.businessType}
            </span>
          )}
          {listing.vacancyCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {listing.vacancyCount}{" "}
              {listing.vacancyCount === 1 ? "вакансія" : "вакансії"}
            </span>
          )}
        </div>

        {listing.address && (
          <p className="line-clamp-1 text-sm text-slate-500">{listing.address}</p>
        )}

        {listing.firstVacancyTitle && (
          <p className="mt-2 text-sm text-slate-700">
            <span className="text-slate-500">потрібен:</span>{" "}
            {listing.firstVacancyTitle}
            {listing.vacancyCount > 1 ? ` +${listing.vacancyCount - 1}` : ""}
          </p>
        )}

        {listing.cityName && (
          <p className="mt-1 text-xs text-slate-400">{listing.cityName}</p>
        )}

        {listing.contactPhone && (
          <p className="mt-auto pt-3 text-sm font-semibold text-amber-700 group-hover:text-amber-800">
            📲 {listing.contactPhone}
          </p>
        )}
      </div>
    </Link>
  );
}
