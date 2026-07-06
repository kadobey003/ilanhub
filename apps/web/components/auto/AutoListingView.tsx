import { AutoPhotoGallery } from "./AutoPhotoGallery";
import { AutoSpecsGrid } from "./AutoSpecsGrid";
import { FavoriteButton } from "@/components/listing/FavoriteButton";
import { ListingBreadcrumb } from "@/components/listing/ListingBreadcrumb";
import { ListingEngagement } from "@/components/listing/ListingEngagement";
import { ListingStatsStrip } from "@/components/listing/ListingStatsStrip";
import { StickyPhoneBar } from "@/components/listing/StickyPhoneBar";
import { formatListingDate } from "@/lib/listing-utils";
import type {
  ListingEngagement as EngagementData,
  PublicListingDetail,
} from "@/lib/listings-types";

interface Props {
  listing: PublicListingDetail;
  engagement: EngagementData;
}

function cleanDescription(text?: string | null): string {
  if (!text) return "";
  return text
    .split("\n")
    .filter(
      (l) =>
        !l.startsWith("📌") && !l.startsWith("🔁") && !l.startsWith("📅"),
    )
    .join("\n")
    .trim();
}

export function AutoListingView({ listing, engagement }: Props) {
  const vehicle = listing.vehicle;
  const title = listing.title ?? "Авто";
  const published = listing.publishedAt
    ? formatListingDate(listing.publishedAt)
    : null;
  const description = cleanDescription(listing.description);

  return (
    <article>
      <ListingBreadcrumb
        project={listing.projectSlug}
        listingTitle={title}
        city={listing.city}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {listing.isPinned && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
            📌 Топ
          </span>
        )}
        {listing.isFeatured && (
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
            ⭐ VIP
          </span>
        )}
        <FavoriteButton listingId={listing.id} />
      </div>

      <AutoPhotoGallery images={listing.media} title={title} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <ListingStatsStrip engagement={engagement} />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
            {listing.city?.name && (
              <p className="mt-1 text-sm text-slate-500">📍 {listing.city.name}</p>
            )}
          </div>
          {listing.price != null && (
            <p className="text-3xl font-bold text-emerald-700">
              {listing.price.toLocaleString("uk-UA")} ₴
            </p>
          )}
        </div>

        {vehicle && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Характеристики
            </h2>
            <AutoSpecsGrid vehicle={vehicle} />
          </div>
        )}

        {description && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Опис
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base">
              {description}
            </p>
          </div>
        )}

        {published && (
          <footer className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            Опубліковано {published}
          </footer>
        )}

        <ListingEngagement
          listingId={listing.id}
          projectId={listing.projectId}
          initial={engagement}
        />
      </div>

      {listing.contactPhone && (
        <StickyPhoneBar
          phone={listing.contactPhone}
          listingId={listing.id}
          projectId={listing.projectId}
        />
      )}
    </article>
  );
}
