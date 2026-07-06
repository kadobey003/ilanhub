import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListingsPageLayout } from "@/components/listings/ListingsPageLayout";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings, fetchProjectBrowseMeta } from "@/lib/listings-api";
import { pageMetadata } from "@/lib/seo";
import { normalizeCitySlug } from "@/lib/cities";

const PROJECT = "horeca";

export const metadata: Metadata = pageMetadata({
  title: "Horeca — вакансії по всій Україні",
  description:
    "Вакансії для ресторанів, кафе, барів та готелів — оберіть місто та знайдіть роботу",
  path: "/horeca/ogoloshennya",
});

export default async function HorecaAllListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: citySlug } = await searchParams;

  if (citySlug) {
    redirect(`/horeca/${normalizeCitySlug(citySlug)}/ogoloshennya`);
  }
  const cities = await fetchProjectCities(PROJECT);
  const [listings, browse] = await Promise.all([
    fetchProjectListings(PROJECT, undefined, "vacancy"),
    fetchProjectBrowseMeta(PROJECT),
  ]);

  return (
    <ListingsPageLayout
      project={PROJECT}
      listings={listings}
      cities={cities}
      browse={browse}
    />
  );
}
