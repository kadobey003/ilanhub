import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { AutoListingCard } from "@/components/auto/AutoListingCard";
import { JobListingCard } from "./JobListingCard";
import type { PublicListingSummary } from "@/lib/listings-types";

interface Props {
  listings: PublicListingSummary[];
  project: string;
  horeca: boolean;
}

export function FeaturedListingsSection({ listings, project, horeca }: Props) {
  const featured = listings.filter((l) => l.isPinned || l.isFeatured);
  if (!featured.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">⭐</span>
        <h2 className="text-lg font-bold text-slate-900">Рекомендовані</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((listing) =>
          horeca ? (
            <HorecaListingCard
              key={listing.id}
              listing={listing}
              project={project}
              featured
            />
          ) : project === "auto" ? (
            <AutoListingCard key={listing.id} listing={listing} project={project} />
          ) : (
            <JobListingCard key={listing.id} listing={listing} project={project} />
          ),
        )}
      </div>
    </section>
  );
}
