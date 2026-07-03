import { api } from "./api.js";

type AddonRow = {
  slug: string;
  name: string;
  price: number;
  billingUnit: "fixed" | "per_vacancy";
  isActive: boolean;
};

type CachedAddons = {
  at: number;
  rows: AddonRow[];
};

const cache = new Map<string, CachedAddons>();
const TTL_MS = 60_000;

function envPinPrice(): number {
  return Number(process.env.HORECA_PIN_PRICE ?? 500);
}

function envDailyPerVacancy(): number {
  return Number(process.env.HORECA_DAILY_DUPLICATE_PRICE ?? 150);
}

async function loadAddons(projectId: string): Promise<AddonRow[]> {
  const hit = cache.get(projectId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.rows;

  try {
    const { data } = await api.getProjectAddons(projectId);
    cache.set(projectId, { at: Date.now(), rows: data });
    return data;
  } catch {
    return [];
  }
}

function priceForSlug(
  rows: AddonRow[],
  slug: string,
  fallback: number,
): number {
  const row = rows.find((r) => r.slug === slug && r.isActive);
  return row?.price ?? fallback;
}

export async function pinPostPrice(projectId: string): Promise<number> {
  const rows = await loadAddons(projectId);
  return priceForSlug(rows, "pin", envPinPrice());
}

export async function dailyDuplicatePrice(
  projectId: string,
  vacancyCount: number,
): Promise<number> {
  const rows = await loadAddons(projectId);
  const per = priceForSlug(rows, "daily_duplicate", envDailyPerVacancy());
  return per * vacancyCount;
}

export function pinReserveNote(): string {
  return process.env.HORECA_PIN_RESERVE_NOTE ?? "";
}

export function invalidateAddonPriceCache(projectId?: string): void {
  if (projectId) cache.delete(projectId);
  else cache.clear();
}
