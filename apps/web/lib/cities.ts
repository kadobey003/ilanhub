export interface CityOption {
  slug: string;
  name: string;
}

export const JOB_CITIES: CityOption[] = [
  { slug: "kyiv", name: "Київ" },
  { slug: "lviv", name: "Львів" },
  { slug: "odesa", name: "Одеса" },
  { slug: "kharkiv", name: "Харків" },
  { slug: "dnipro", name: "Дніпро" },
  { slug: "zaporizhzhia", name: "Запоріжжя" },
];

const SLUG_ALIASES: Record<string, string> = {
  київ: "kyiv",
  киев: "kyiv",
  kyiv: "kyiv",
  львів: "lviv",
  львов: "lviv",
  lviv: "lviv",
  одеса: "odesa",
  odesa: "odesa",
  харків: "kharkiv",
  харьков: "kharkiv",
  kharkiv: "kharkiv",
  дніпро: "dnipro",
  днепр: "dnipro",
  dnipro: "dnipro",
  запоріжжя: "zaporizhzhia",
  запорожье: "zaporizhzhia",
  zaporizhzhia: "zaporizhzhia",
};

export function normalizeCitySlug(raw: string): string {
  const decoded = decodeURIComponent(raw).trim().toLowerCase();
  return SLUG_ALIASES[decoded] ?? decoded;
}

export function cityDisplayName(slug: string): string {
  const normalized = normalizeCitySlug(slug);
  return JOB_CITIES.find((c) => c.slug === normalized)?.name ?? decodeURIComponent(slug);
}

export function cityListingsPath(project: string, citySlug: string): string {
  return `/${project}/${normalizeCitySlug(citySlug)}/ogoloshennya`;
}

export function projectAllListingsPath(project: string): string {
  return `/${project}/ogoloshennya`;
}
