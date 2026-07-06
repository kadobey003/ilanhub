import type { Metadata } from "next";
import { ListingsPageLayout } from "@/components/listings/ListingsPageLayout";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings, fetchProjectBrowseMeta } from "@/lib/listings-api";

const PROJECT = "horeca";

export const metadata: Metadata = {
  title: "Horeca — вакансії по всій Україні",
  description: "Вакансії для ресторанів, кафе, барів та готелів — оберіть місто та знайдіть роботу",
};

export default async function HorecaAllListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: citySlug } = await searchParams;
  const cities = await fetchProjectCities(PROJECT);
  const cityName = citySlug ? cities.find((c) => c.slug === citySlug)?.name : undefined;
  const [listings, browse] = await Promise.all([
    fetchProjectListings(PROJECT, citySlug, "vacancy"),
    fetchProjectBrowseMeta(PROJECT, citySlug),
  ]);

  return (
    <ListingsPageLayout
      project={PROJECT}
      listings={listings}
      cities={cities}
      browse={browse}
      citySlug={citySlug}
      cityName={cityName}
    />
  );
}
