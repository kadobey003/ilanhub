import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ListingsPageLayout } from "@/components/listings/ListingsPageLayout";
import { fetchProjectCities } from "@/lib/cities-api";
import { cityDisplayName, normalizeCitySlug } from "@/lib/cities";
import { fetchProjectListings, fetchProjectBrowseMeta, isHorecaProject } from "@/lib/listings-api";
import { getProjectMeta } from "@/lib/project-meta";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string; city: string }>;
}): Promise<Metadata> {
  const { project, city } = await params;
  const meta = getProjectMeta(project);
  const citySlug = normalizeCitySlug(city);
  const cityName = cityDisplayName(citySlug);
  return pageMetadata({
    title: `${meta.title} — ${cityName}`,
    description: `Вакансії та оголошення у місті ${cityName} на UAREKLAMHUB`,
    path: `/${project}/${citySlug}/ogoloshennya`,
  });
}

export default async function CityListingsPage({
  params,
}: {
  params: Promise<{ project: string; city: string }>;
}) {
  const { project, city } = await params;
  const citySlug = normalizeCitySlug(city);
  const cityName = cityDisplayName(citySlug);

  if (city !== citySlug) {
    redirect(`/${project}/${citySlug}/ogoloshennya`);
  }

  const [listings, cities, browse] = await Promise.all([
    fetchProjectListings(
      project,
      citySlug,
      isHorecaProject(project) ? "vacancy" : undefined,
    ),
    fetchProjectCities(project),
    fetchProjectBrowseMeta(project, citySlug),
  ]);

  return (
    <ListingsPageLayout
      project={project}
      listings={listings}
      cities={cities}
      browse={browse}
      citySlug={citySlug}
      cityName={cityName}
    />
  );
}
