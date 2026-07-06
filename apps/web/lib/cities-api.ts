import { API_URL } from "./api-url";
import { type CityOption } from "./cities";

export async function fetchProjectCities(projectSlug: string): Promise<CityOption[]> {
  try {
    const res = await fetch(`${API_URL}/api/projects/${projectSlug}/cities`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { slug: string; name: string }[] };
    return json.data?.filter((c) => c.slug && c.name) ?? [];
  } catch {
    return [];
  }
}
