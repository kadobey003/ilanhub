import type { MetadataRoute } from "next";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings } from "@/lib/listings-api";
import { getSiteUrl } from "@/lib/seo";
import { HORECA_ROLES, JOB_CATEGORIES } from "@/lib/seo-content";

const PROJECTS = ["jobs", "horeca", "auto"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/robota`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/robota/employer`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/horeca`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/horeca/ogoloshennya`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/horeca/prodazh`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/avto`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  for (const role of HORECA_ROLES) {
    staticPages.push({
      url: `${base}/horeca/vakansiyi/${role.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.75,
    });
  }

  for (const cat of JOB_CATEGORIES) {
    staticPages.push({
      url: `${base}/jobs/kategoriya/${cat.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.75,
    });
  }

  const cityPages: MetadataRoute.Sitemap = [];
  for (const project of ["jobs", "horeca"] as const) {
    const cities = await fetchProjectCities(project);
    for (const city of cities) {
      cityPages.push({
        url: `${base}/${project}/${city.slug}/ogoloshennya`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
      if (project === "horeca") {
        cityPages.push({
          url: `${base}/horeca/${city.slug}/prodazh`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    }
  }

  const listingPages: MetadataRoute.Sitemap = [];
  for (const project of PROJECTS) {
    const listings = await fetchProjectListings(project);
    for (const listing of listings) {
      const lastModified = listing.publishedAt
        ? new Date(listing.publishedAt)
        : now;
      listingPages.push({
        url: `${base}/${project}/listing/${listing.id}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  }

  return [...staticPages, ...cityPages, ...listingPages];
}
