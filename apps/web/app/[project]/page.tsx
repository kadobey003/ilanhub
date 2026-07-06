import type { Metadata } from "next";
import { ListingsPageLayout } from "@/components/listings/ListingsPageLayout";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings, fetchProjectBrowseMeta } from "@/lib/listings-api";
import { getProjectMeta } from "@/lib/project-meta";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string }>;
}): Promise<Metadata> {
  const { project } = await params;
  const meta = getProjectMeta(project);
  return pageMetadata({
    title: meta.title,
    description: meta.subtitle,
    path: project === "jobs" ? "/jobs" : `/${project}`,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;

  const [listings, cities, browse] = await Promise.all([
    fetchProjectListings(project),
    fetchProjectCities(project),
    fetchProjectBrowseMeta(project),
  ]);

  return (
    <ListingsPageLayout
      project={project}
      listings={listings}
      cities={cities}
      browse={browse}
    />
  );
}
