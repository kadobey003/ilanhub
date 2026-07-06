import Link from "next/link";
import { HorecaCoverImage } from "./HorecaCoverImage";
import { formatListingDate } from "@/lib/listing-utils";
import type { PublicListingSummary } from "@/lib/listings-types";

interface Props {
  listing: PublicListingSummary;
  project: string;
  featured?: boolean;
}

export function HorecaListingCard({ listing, project, featured }: Props) {
  const title = listing.title ?? "Заклад";
  const date = formatListingDate(listing.publishedAt);
  const highlight = featured || listing.isPinned || listing.isFeatured;

  return (
    <Link
      href={`/${project}/listing/${listing.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        highlight
          ? "border-amber-300 ring-1 ring-amber-200 hover:border-amber-400 hover:shadow-amber-100"
          : "border-slate-200 hover:border-amber-300"
      }`}
    >
      <div className="relative">
        <HorecaCoverImage
          src={listing.imageUrl}
          title={title}
          sizes="card"
          className="rounded-none rounded-t-2xl"
        />
        {(listing.isPinned || listing.isFeatured) && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {listing.isPinned && (
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-amber-800 shadow">
                📌 Топ
              </span>
            )}
            {listing.isFeatured && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                ⭐ VIP
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {listing.businessType && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium capitalize text-amber-900">
              {listing.businessType}
            </span>
          )}
          {listing.cityName && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              📍 {listing.cityName}
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
            <span className="font-medium">{listing.firstVacancyTitle}</span>
            {listing.vacancyCount > 1 ? ` +${listing.vacancyCount - 1}` : ""}
          </p>
        )}

        {listing.firstSalary && (
          <p className="mt-2 inline-flex w-fit rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
            💰 {listing.firstSalary}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          {listing.contactPhone ? (
            <p className="text-sm font-semibold text-amber-700 group-hover:text-amber-800">
              📲 {listing.contactPhone}
            </p>
          ) : (
            <span />
          )}
          {date && <time className="text-xs text-slate-400">{date}</time>}
        </div>
      </div>
    </Link>
  );
}
