import { HorecaCoverImage } from "./HorecaCoverImage";
import { HorecaThemeToggle } from "./HorecaThemeToggle";
import { HorecaPostBody } from "./HorecaPostBody";
import { FavoriteButton } from "@/components/listing/FavoriteButton";
import { ListingBreadcrumb } from "@/components/listing/ListingBreadcrumb";
import { ListingEngagement } from "@/components/listing/ListingEngagement";
import { ListingMap } from "@/components/listing/ListingMap";
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

function formatFullDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function HorecaListingView({ listing, engagement }: Props) {
  const published = formatFullDate(listing.publishedAt);
  const isHoreca = listing.projectSlug === "horeca";
  const title = listing.title ?? (isHoreca ? "Заклад" : "Компанія");

  return (
    <article>
      <ListingBreadcrumb
        project={listing.projectSlug}
        listingTitle={title}
        city={listing.city}
      />

      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {isHoreca && <HorecaThemeToggle variant="inline" />}
        {listing.isPinned && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            📌 Топ
          </span>
        )}
        {listing.isFeatured && (
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
            ⭐ VIP
          </span>
        )}
        <FavoriteButton listingId={listing.id} />
      </div>

      <HorecaCoverImage
        src={listing.imageUrl}
        title={title}
        sizes="detail"
        className="mb-6 shadow-lg"
      />

      <div className="horeca-detail-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <ListingStatsStrip engagement={engagement} isHoreca={isHoreca} />

        <HorecaPostBody listing={listing} />

        {listing.address && (
          <ListingMap address={listing.address} city={listing.city?.name} />
        )}

        {(published || listing.city?.name) && (
          <footer className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
            {listing.city?.name && <span>📍 {listing.city.name}</span>}
            {published && <span>Опубліковано {published}</span>}
            <span>{listing.categoryName}</span>
            {formatListingDate(listing.publishedAt) && (
              <span>🕐 {formatListingDate(listing.publishedAt)}</span>
            )}
          </footer>
        )}

        <ListingEngagement
          listingId={listing.id}
          projectId={listing.projectId}
          initial={engagement}
          isHoreca={isHoreca}
        />
      </div>

      {listing.contactPhone && (
        <StickyPhoneBar
          phone={listing.contactPhone}
          listingId={listing.id}
          projectId={listing.projectId}
          isHoreca={isHoreca}
        />
      )}
    </article>
  );
}
