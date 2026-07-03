import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HorecaListingView } from "@/components/horeca/HorecaListingView";
import { ListingAnalytics } from "@/components/ListingAnalytics";
import { fetchListingDetail, isHorecaProject } from "@/lib/listings-api";

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
  const listing = await fetchListingDetail(id);

  if (!listing) {
    notFound();
  }

  if (isHorecaProject(project) || isHorecaProject(listing.projectSlug)) {
    return (
      <div className="py-6 sm:py-10">
        <ListingAnalytics listingId={listing.id} projectId={listing.projectId} />
        <HorecaListingView listing={listing} />
      </div>
    );
  }

  return (
    <>
      <ListingAnalytics listingId={listing.id} projectId={listing.projectId} />
      <article className="mx-auto max-w-2xl rounded-lg border bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">{listing.title}</h1>
      {listing.price != null && (
        <p className="mb-4 text-xl font-semibold text-brand">{listing.price} ₴</p>
      )}
      <p className="whitespace-pre-wrap text-gray-700">{listing.description}</p>
    </article>
    </>
  );
}
