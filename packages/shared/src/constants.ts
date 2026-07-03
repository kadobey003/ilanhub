import { BoostType } from "./types.js";

export const QUEUE_NAMES = {
  PUBLICATION: "publication",
  PAYMENT: "payment",
  MODERATION: "moderation",
  ANALYTICS: "analytics",
  NOTIFICATION: "notification",
} as const;

export const SESSION_TTL = 86_400;

export const DEFAULT_LOCALE = "uk";

export const DEFAULT_CURRENCY = "UAH";

export const BRAND_NAME = "UAREKLAMHUB";

export const BRAND_LOGO_PATH = "/logo.png";

export const FREE_MONTHLY_LISTING_QUOTA = 1;

export const SINGLE_LISTING_FEE = 49;

/** Ціна за оголошення залежно від кількості вакансій (1–3) */
export const DEFAULT_VACANCY_BUNDLES = [
  { vacancyCount: 1, name: "1 вакансія", price: 299 },
  { vacancyCount: 2, name: "2 вакансії", price: 499 },
  { vacancyCount: 3, name: "3 вакансії", price: 699 },
] as const;

export const MAX_VACANCIES_PER_LISTING = 3;

export const BANK_TRANSFER_TIMEOUT_HOURS = 24;

export const BOOST_PRICES: Record<BoostType, number> = {
  [BoostType.VIP]: 99,
  [BoostType.PIN]: 199,
  [BoostType.FEATURED]: 149,
  [BoostType.COMBO]: 349,
};

export const BOOST_DURATIONS_DAYS: Record<BoostType, number> = {
  [BoostType.VIP]: 7,
  [BoostType.PIN]: 3,
  [BoostType.FEATURED]: 5,
  [BoostType.COMBO]: 7,
};
