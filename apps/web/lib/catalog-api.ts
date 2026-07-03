import type { ApiCategory, ApiCity, ApiProject } from "@ilanhub/shared";
import { PUBLIC_API_URL } from "./api-url";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${PUBLIC_API_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchActiveProjects(): Promise<ApiProject[]> {
  const json = await request<{ data: ApiProject[] }>("/api/projects");
  return json.data ?? [];
}

export async function fetchProjectCategories(
  projectId: string,
): Promise<ApiCategory[]> {
  const json = await request<{ data: ApiCategory[] }>(
    `/api/projects/${projectId}/categories`,
  );
  return json.data ?? [];
}

export async function fetchProjectCities(projectId: string): Promise<ApiCity[]> {
  const json = await request<{ data: ApiCity[] }>(
    `/api/projects/${projectId}/cities`,
  );
  return json.data ?? [];
}
