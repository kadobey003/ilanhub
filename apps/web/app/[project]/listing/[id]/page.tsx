import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HorecaListingView } from "@/components/horeca/HorecaListingView";
import { ListingDetailLayout } from "@/components/listing/ListingDetailLayout";
import { ListingEngagement } from "@/components/listing/ListingEngagement";
import { RelatedListingsSidebar } from "@/components/listing/RelatedListingsSidebar";
import { ListingAnalytics } from "@/components/ListingAnalytics";
import {
  fetchListingDetail,
  fetchListingEngagement,
  fetchProjectListings,
  isVacancyStyleProject,
} from "@/lib/listings-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListingDetail(id);
  if (!listing?.title) return { title: "Оголошення" };
  return {
    title: listing.title,
    description: listing.address ?? undefined,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ project: string; id: string }>;
}) {
  const { project, id } = await params;
  const [listing, engagement, relatedListings] = await Promise.all([
    fetchListingDetail(id),
    fetchListingEngagement(id),
    fetchProjectListings(project),
  ]);

  if (!listing) {
    notFound();
  }

  const sidebar = (
    <RelatedListingsSidebar
      listings={relatedListings}
      project={project}
      currentId={listing.id}
    />
  );

  if (isVacancyStyleProject(project) || isVacancyStyleProject(listing.projectSlug ?? "")) {
    return (
      <div className="py-6 sm:py-10">
        <ListingAnalytics listingId={listing.id} projectId={listing.projectId} />
        <ListingDetailLayout
          main={<HorecaListingView listing={listing} engagement={engagement} />}
          sidebar={sidebar}
        />
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10">
      <ListingAnalytics listingId={listing.id} projectId={listing.projectId} />
      <ListingDetailLayout
        main={
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="mb-4 text-2xl font-bold">{listing.title}</h1>
            {listing.price != null && (
              <p className="mb-4 text-xl font-semibold text-brand">
                {listing.price} ₴
              </p>
            )}
            <p className="whitespace-pre-wrap text-gray-700">
              {listing.description}
            </p>
            <ListingEngagement
              listingId={listing.id}
              projectId={listing.projectId}
              initial={engagement}
            />
          </article>
        }
        sidebar={sidebar}
      />
    </div>
  );
}
