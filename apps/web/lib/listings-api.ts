import type {
  ListingEngagement,
  ProjectBrowseMeta,
  PublicListingDetail,
  PublicListingSummary,
} from "./listings-types";
import { API_URL } from "./api-url";

export async function fetchProjectListings(
  project: string,
  city?: string,
  kind?: "product" | "vacancy",
): Promise<PublicListingSummary[]> {
  try {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const path = city
      ? `/api/projects/${project}/cities/${city}/listings${qs}`
      : `/api/projects/${project}/listings${qs}`;
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchListingEngagement(
  id: string,
): Promise<ListingEngagement> {
  const empty: ListingEngagement = { views: 0, likes: 0, comments: [] };
  try {
    const res = await fetch(`${API_URL}/api/listings/${id}/engagement`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return empty;
    const json = await res.json();
    return json.data ?? empty;
  } catch {
    return empty;
  }
}

export async function fetchListingDetail(
  id: string,
): Promise<PublicListingDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/listings/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export function isHorecaProject(slug: string): boolean {
  return slug === "horeca";
}

export function isAutoProject(slug: string): boolean {
  return slug === "auto";
}

export function isVacancyStyleProject(slug: string): boolean {
  return slug === "horeca" || slug === "jobs";
}

export async function fetchProjectBrowseMeta(
  project: string,
  city?: string,
): Promise<ProjectBrowseMeta> {
  const empty: ProjectBrowseMeta = {
    categories: [],
    telegramChannels: [],
    botUsername: null,
  };
  try {
    const qs = city ? `?city=${encodeURIComponent(city)}` : "";
    const res = await fetch(`${API_URL}/api/projects/${project}/browse${qs}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return empty;
    const json = await res.json();
    return json.data ?? empty;
  } catch {
    return empty;
  }
}
