import { DEFAULT_VACANCY_BUNDLES } from "@ilanhub/shared";

export interface VacancyBundleDefinition {
  vacancyCount: number;
  name: string;
  price: number;
  currency: string;
}

export const VACANCY_BUNDLE_DEFAULTS: VacancyBundleDefinition[] =
  DEFAULT_VACANCY_BUNDLES.map((b) => ({ ...b, currency: "UAH" }));

export function getBundleByCount(
  count: number,
): VacancyBundleDefinition | undefined {
  return VACANCY_BUNDLE_DEFAULTS.find((b) => b.vacancyCount === count);
}
