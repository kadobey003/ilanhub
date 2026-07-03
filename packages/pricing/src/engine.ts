import { DEFAULT_CURRENCY } from "@ilanhub/shared";

export type ListingCostSource = "vacancy_bundle" | "free";

export interface VacancyBundleTier {
  vacancyCount: number;
  price: number;
}

export interface ListingCostResult {
  amount: number;
  currency: string;
  source: ListingCostSource;
  vacancyCount: number;
}

export function calculateVacancyBundlePrice(
  vacancyCount: number,
  tiers: VacancyBundleTier[],
): ListingCostResult {
  const tier = tiers.find((t) => t.vacancyCount === vacancyCount);
  const amount = tier?.price ?? 0;
  return {
    amount,
    currency: DEFAULT_CURRENCY,
    source: amount > 0 ? "vacancy_bundle" : "free",
    vacancyCount,
  };
}
