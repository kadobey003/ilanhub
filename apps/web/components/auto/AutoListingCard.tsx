import Link from "next/link";
import Image from "next/image";
import { formatListingDate } from "@/lib/listing-utils";
import type { PublicListingSummary } from "@/lib/listings-types";

interface Props {
  listing: PublicListingSummary;
  project?: string;
}

export function AutoListingCard({ listing, project = "auto" }: Props) {
  const title = listing.title ?? "Авто";
  const price =
    listing.salePrice != null
      ? `${listing.salePrice.toLocaleString("uk-UA")} ₴`
      : listing.firstSalary ?? null;
  const meta = [
    listing.vehicleYear ? `${listing.vehicleYear} р.` : null,
    listing.vehicleMileage != null
      ? `${listing.vehicleMileage.toLocaleString("uk-UA")} км`
      : null,
    listing.cityName,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/${project}/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt={title}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🚗</div>
        )}
        {(listing.isPinned || listing.isFeatured) && (
          <div className="absolute left-3 top-3 flex gap-1.5">
            {listing.isPinned && (
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-emerald-800 shadow">
                📌 Топ
              </span>
            )}
            {listing.isFeatured && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                ⭐ VIP
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-slate-900 group-hover:text-emerald-700">{title}</h3>
        {price && <p className="mt-1 text-lg font-bold text-emerald-700">{price}</p>}
        {meta && <p className="mt-2 text-sm text-slate-500">{meta}</p>}
        {listing.publishedAt && (
          <p className="mt-auto pt-3 text-xs text-slate-400">
            {formatListingDate(listing.publishedAt)}
          </p>
        )}
      </div>
    </Link>
  );
}
