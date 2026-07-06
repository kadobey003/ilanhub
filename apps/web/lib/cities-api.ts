import { API_URL } from "./api-url";
import { JOB_CITIES, type CityOption } from "./cities";

export async function fetchProjectCities(projectSlug: string): Promise<CityOption[]> {
  try {
    const res = await fetch(`${API_URL}/api/projects/${projectSlug}/cities`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return JOB_CITIES;
    const json = (await res.json()) as { data?: { slug: string; name: string }[] };
    const rows = json.data?.filter((c) => c.slug && c.name) ?? [];
    return rows.length ? rows : JOB_CITIES;
  } catch {
    return JOB_CITIES;
  }
}
