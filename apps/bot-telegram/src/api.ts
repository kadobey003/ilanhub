const API_URL = process.env.API_URL ?? "http://localhost:3010";
const BOT_SECRET = process.env.BOT_INTERNAL_SECRET ?? "dev-bot-secret";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-bot-secret": BOT_SECRET,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    let message = err;
    try {
      const parsed = JSON.parse(err) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) message = parsed.message.join(", ");
      else if (parsed.message) message = parsed.message;
    } catch {
      // keep raw text
    }
    throw new Error(message || `API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface BotListingPayload {
  channel: string;
  externalUserId: string;
  firstName?: string;
  projectId: string;
  categoryId: string;
  cityId: string;
  districtId?: string;
  businessType?: string;
  title: string;
  address?: string;
  description?: string;
  contactPhone?: string;
  listingPrice?: number;
  bundlePriceId?: string;
  mediaUrls?: string[];
  positions: Array<{
    title: string;
    salary?: string;
    workingHours?: string;
    price?: number;
    vacancyTypeId?: string;
  }>;
}

export interface BotListingDetail {
  id: string;
  status: string;
  projectId: string;
  categoryId: string;
  cityId: string;
  districtId?: string | null;
  businessType?: string | null;
  title: string;
  address?: string | null;
  description?: string | null;
  contactPhone?: string | null;
  price: number | null;
  positions: Array<{
    title: string;
    salary?: string | null;
    workingHours?: string | null;
    description?: string | null;
    vacancyTypeId?: string | null;
  }>;
  mediaUrls: string[];
}

export const api = {
  getTelegramConfig: () =>
    apiFetch<{
      botToken: string | null;
      projectId: string | null;
      botUsername: string | null;
      paymentProviderToken: string | null;
    }>("/api/bots/telegram/config"),
  getProjects: () => apiFetch<{ data: import("@ilanhub/shared").ApiProject[] }>("/api/projects"),
  getCategories: (projectId: string) =>
    apiFetch<{ data: import("@ilanhub/shared").ApiCategory[] }>(
      `/api/projects/${projectId}/categories`,
    ),
  getCities: (projectId: string) =>
    apiFetch<{ data: import("@ilanhub/shared").ApiCity[] }>(
      `/api/projects/${projectId}/cities`,
    ),
  getVacancyTypes: (projectId: string) =>
    apiFetch<{ data: import("@ilanhub/shared").ApiVacancyType[] }>(
      `/api/bots/projects/${projectId}/vacancy-types`,
    ),
  getProjectAddons: (projectId: string) =>
    apiFetch<{
      data: Array<{
        slug: string;
        name: string;
        price: number;
        billingUnit: "fixed" | "per_vacancy";
        isActive: boolean;
      }>;
    }>(`/api/bots/projects/${projectId}/addons`),
  createBotListing: (body: BotListingPayload) =>
    apiFetch<{ data: { id: string } }>("/api/bots/listings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  submitListing: (id: string) =>
    apiFetch(`/api/listings/${id}/submit`, { method: "POST" }),
  getUserListings: (channel: string, userId: string) =>
    apiFetch<{ data: import("@ilanhub/shared").ApiListing[] }>(
      `/api/users/${channel}/${userId}/listings`,
    ),
  resubmitListing: (id: string, externalUserId: string) =>
    apiFetch(`/api/bots/listings/${id}/resubmit`, {
      method: "POST",
      body: JSON.stringify({ channel: "telegram", externalUserId }),
    }),
  prepareBotPayment: (listingId: string, externalUserId: string) =>
    apiFetch<{
      data: {
        listingId: string;
        reference: string;
        payload: string;
        amountUah: number;
        amountKopiykas: number;
        currency: string;
        title: string;
        description: string;
        label: string;
        providerToken: string;
        paymentUrl?: string | null;
      };
    }>(`/api/bots/listings/${listingId}/payment/prepare`, {
      method: "POST",
      body: JSON.stringify({ channel: "telegram", externalUserId }),
    }),
  validateTelegramPreCheckout: (body: {
    channel: string;
    externalUserId: string;
    payload: string;
    totalAmount: number;
  }) =>
    apiFetch<{ ok: boolean; error?: string }>(
      "/api/bots/payments/telegram/pre-checkout",
      { method: "POST", body: JSON.stringify(body) },
    ),
  completeTelegramPayment: (body: {
    channel: string;
    externalUserId: string;
    payload: string;
    currency: string;
    totalAmount: number;
    telegramPaymentChargeId: string;
    providerPaymentChargeId: string;
  }) =>
    apiFetch<{
      data: {
        listingId: string;
        status: string;
        alreadyPaid: boolean;
      };
    }>("/api/bots/payments/telegram/complete", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getBotListing: (id: string, userId: string) =>
    apiFetch<{ data: BotListingDetail }>(
      `/api/bots/listings/${id}?channel=telegram&externalUserId=${encodeURIComponent(userId)}`,
    ),
  updateBotListing: (id: string, body: BotListingPayload) =>
    apiFetch<{ data: { id: string; status: string; price: number | null } }>(
      `/api/bots/listings/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  botStart: (telegramId: string, startPayload: string, firstName?: string) =>
    apiFetch<{ action: string }>("/api/auth/bot/start", {
      method: "POST",
      body: JSON.stringify({ telegramId, startPayload, firstName }),
    }),
  botContact: (telegramId: string, phone: string, firstName?: string) =>
    apiFetch<{ user: { id: string }; linked: boolean }>("/api/auth/bot/contact", {
      method: "POST",
      body: JSON.stringify({ telegramId, phone, firstName }),
    }),
  adminBotAction: (body: {
    chatId: string;
    userId: string;
    userName?: string;
    action: string;
    args?: string[];
  }) =>
    apiFetch<{ message: string }>("/api/bots/admin/action", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
