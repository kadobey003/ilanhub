import type { PublicListingDetail, PublicListingSummary } from "./listings-types";
import { API_URL } from "./api-url";

export async function fetchProjectListings(
  project: string,
  city?: string,
): Promise<PublicListingSummary[]> {
  try {
    const path = city
      ? `/api/projects/${project}/cities/${city}/listings`
      : `/api/projects/${project}/listings`;
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
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
