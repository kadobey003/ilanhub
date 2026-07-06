import { ListingsPageLayout } from "@/components/listings/ListingsPageLayout";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings, fetchProjectBrowseMeta } from "@/lib/listings-api";

interface Props {
  project: string;
  citySlug?: string;
  cityName?: string;
}

export async function ProjectListingsPage({
  project,
  citySlug,
  cityName,
}: Props) {
  const [listings, cities, browse] = await Promise.all([
    fetchProjectListings(project, citySlug),
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
