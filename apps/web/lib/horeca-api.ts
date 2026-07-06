import type { ApiCategory, ApiCity, ApiVacancyType } from "@ilanhub/shared";
import { PUBLIC_API_URL } from "./api-url";
import { getToken } from "./auth";

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ??
      (res.status === 413 ? "Request entity too large" : `API error ${res.status}`);
    throw new Error(message);
  }
  return json as T;
}

export type ProjectAddon = {
  slug: string;
  name: string;
  price: number;
  billingUnit: "fixed" | "per_vacancy";
  isActive: boolean;
};

export async function fetchVacancyTypes(projectId: string) {
  const json = await authRequest<{ data: ApiVacancyType[] }>(
    `/api/account/projects/${projectId}/vacancy-types`,
  );
  return json.data ?? [];
}

export async function fetchProjectAddons(projectId: string) {
  const json = await authRequest<{ data: ProjectAddon[] }>(
    `/api/account/projects/${projectId}/addons`,
  );
  return json.data ?? [];
}

export async function fetchHorecaCategory(projectId: string) {
  const json = await authRequest<{ data: ApiCategory }>(
    `/api/account/projects/${projectId}/horeca/category`,
  );
  return json.data;
}

export async function uploadListingPhoto(dataUrl: string) {
  return authRequest<{ url: string }>("/api/account/uploads", {
    method: "POST",
    body: JSON.stringify({ dataUrl }),
  });
}

export interface HorecaListingPayload {
  projectId: string;
  categoryId: string;
  cityId: string;
  businessType?: string;
  title: string;
  address?: string;
  benefits?: string;
  pinPost?: boolean;
  dailyDuplicate?: boolean;
  scheduledPostAt?: string;
  contactPhone?: string;
  listingPrice?: number;
  bundlePriceId?: string;
  mediaUrls?: string[];
  positions: Array<{
    title: string;
    salary?: string;
    workingHours?: string;
    description?: string;
  }>;
}

export async function createHorecaListing(payload: HorecaListingPayload) {
  return authRequest<{ data: { id: string; status: string; price: number | null } }>(
    "/api/account/listings/horeca",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function fetchHorecaSellCategory(projectId: string) {
  const json = await authRequest<{ data: ApiCategory }>(
    `/api/account/projects/${projectId}/horeca/sell/category`,
  );
  return json.data;
}

export async function createHorecaSellListing(payload: HorecaListingPayload) {
  return authRequest<{ data: { id: string; status: string; price: number | null } }>(
    "/api/account/listings/horeca/sell",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function fetchProjectCities(projectId: string): Promise<ApiCity[]> {
  const res = await fetch(`${PUBLIC_API_URL}/api/projects/${projectId}/cities`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = (await res.json()) as { data: ApiCity[] };
  return json.data ?? [];
}

export async function fetchHorecaProjectId() {
  const res = await fetch(`${PUBLIC_API_URL}/api/projects`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = (await res.json()) as { data: Array<{ id: string; slug: string }> };
  return json.data?.find((p) => p.slug === "horeca")?.id ?? null;
}
