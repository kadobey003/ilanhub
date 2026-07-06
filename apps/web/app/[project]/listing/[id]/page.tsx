import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HorecaListingView } from "@/components/horeca/HorecaListingView";
import { AutoListingView } from "@/components/auto/AutoListingView";
import { ListingDetailLayout } from "@/components/listing/ListingDetailLayout";
import { ListingEngagement } from "@/components/listing/ListingEngagement";
import { RelatedListingsSidebar } from "@/components/listing/RelatedListingsSidebar";
import { ListingAnalytics } from "@/components/ListingAnalytics";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  fetchListingDetail,
  fetchListingEngagement,
  fetchProjectListings,
  isVacancyStyleProject,
} from "@/lib/listings-api";
import { rankRelatedListings } from "@/lib/listing-utils";
import {
  breadcrumbJsonLd,
  jobPostingJsonLd,
  pageMetadata,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string; id: string }>;
}): Promise<Metadata> {
  const { project, id } = await params;
  const listing = await fetchListingDetail(id);
  if (!listing?.title) return { title: "Оголошення" };
  const description =
    listing.firstVacancyTitle ??
    listing.address ??
    listing.description ??
    undefined;
  const cityPart = listing.city?.name ? ` — ${listing.city.name}` : "";
  return pageMetadata({
    title: `${listing.title}${cityPart}`,
    description,
    path: `/${project}/listing/${id}`,
    ogImage: listing.imageUrl,
    ogType: "article",
  });
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

  const related = rankRelatedListings(relatedListings, listing);
  const isVacancy = isVacancyStyleProject(project) || isVacancyStyleProject(listing.projectSlug ?? "");
  const landingPath = project === "jobs" ? "/jobs" : `/${project}`;
  const cityPath = listing.city
    ? `/${project}/${listing.city.slug}/ogoloshennya`
    : landingPath;

  const schemaData = isVacancy
    ? [
        jobPostingJsonLd(listing),
        breadcrumbJsonLd([
          { name: listing.projectName, path: landingPath },
          ...(listing.city
            ? [{ name: listing.city.name, path: cityPath }]
            : []),
          { name: listing.title ?? "Оголошення", path: `/${project}/listing/${id}` },
        ]),
      ]
    : [];

  const sidebar = (
    <RelatedListingsSidebar
      listings={related}
      project={project}
      currentId={listing.id}
    />
  );

  if (isVacancy) {
    return (
      <div className="py-6 sm:py-10">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": schemaData,
          }}
        />
        <ListingAnalytics listingId={listing.id} projectId={listing.projectId} />
        <ListingDetailLayout
          main={<HorecaListingView listing={listing} engagement={engagement} />}
          sidebar={sidebar}
        />
      </div>
    );
  }

  if (project === "auto" || listing.projectSlug === "auto") {
    return (
      <div className="py-6 sm:py-10">
        <ListingAnalytics listingId={listing.id} projectId={listing.projectId} />
        <ListingDetailLayout
          main={<AutoListingView listing={listing} engagement={engagement} />}
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
