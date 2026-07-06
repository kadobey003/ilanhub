import { HorecaCoverImage } from "./HorecaCoverImage";
import { HorecaPostBody } from "./HorecaPostBody";
import { ListingEngagement } from "@/components/listing/ListingEngagement";
import type { ListingEngagement as EngagementData, PublicListingDetail } from "@/lib/listings-types";

interface Props {
  listing: PublicListingDetail;
  engagement: EngagementData;
}

function formatDate(value?: string | null): string | null {
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
  const published = formatDate(listing.publishedAt);

  return (
    <article>
      <HorecaCoverImage
        src={listing.imageUrl}
        title={listing.title ?? "Заклад"}
        sizes="detail"
        className="mb-6 shadow-lg"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <HorecaPostBody listing={listing} />

        {(published || listing.city?.name) && (
          <footer className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
            {listing.city?.name && <span>📍 {listing.city.name}</span>}
            {published && <span>Опубліковано {published}</span>}
            <span>{listing.categoryName}</span>
          </footer>
        )}

        <ListingEngagement
          listingId={listing.id}
          projectId={listing.projectId}
          initial={engagement}
        />
      </div>
    </article>
  );
}
