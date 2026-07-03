import { DEFAULT_CURRENCY } from "./constants.js";

const UAH_FORMATTER = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: DEFAULT_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const FREE_LABEL_UK = "Безкоштовно";

export function formatAmountUah(amount: number): string {
  if (amount <= 0) return FREE_LABEL_UK;
  return `${amount.toLocaleString("uk-UA")} ₴`;
}

export function formatAddonUah(amount: number): string {
  if (amount <= 0) return FREE_LABEL_UK;
  return `+${amount.toLocaleString("uk-UA")} ₴`;
}

export function formatPrice(amount: number, currency = DEFAULT_CURRENCY): string {
  if (amount <= 0 && currency === DEFAULT_CURRENCY) {
    return FREE_LABEL_UK;
  }
  if (currency === DEFAULT_CURRENCY) {
    return UAH_FORMATTER.format(amount);
  }
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generatePaymentReference(listingId: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const shortId = listingId.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `ILAN-${shortId}-${rand}`;
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
