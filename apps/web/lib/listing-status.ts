export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Чернетка", color: "bg-slate-100 text-slate-600" },
  pending_payment: { label: "Очікує оплату", color: "bg-amber-100 text-amber-800" },
  pending_moderation: { label: "На модерації", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Схвалено", color: "bg-indigo-100 text-indigo-800" },
  publishing: { label: "Публікація", color: "bg-violet-100 text-violet-800" },
  published: { label: "Опубліковано", color: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Відхилено", color: "bg-red-100 text-red-800" },
  expired: { label: "Завершено", color: "bg-slate-100 text-slate-500" },
};

export function formatPrice(price: number | null, currency: string) {
  if (price == null) return "—";
  if (currency === "UAH" && price <= 0) return "Безкоштовно";
  return `${price.toLocaleString("uk-UA")} ${currency === "UAH" ? "₴" : currency}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
