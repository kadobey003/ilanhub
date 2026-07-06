const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("ilanhub_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options?.headers,
    },
    credentials: "include",
  });
  if (res.status === 401) {
    localStorage.removeItem("ilanhub_admin_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => null) as { message?: string | string[] } | null;
    const msg = Array.isArray(errBody?.message)
      ? errBody.message.join(", ")
      : errBody?.message;
    throw new Error(msg ?? `API ${res.status}: ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  dashboard: () =>
    apiClient<{ pending: number; published: number; revenue: number; users: number }>(
      "/admin/dashboard",
    ),
  listings: (status?: string) =>
    apiClient<{ data: ListingRow[] }>(`/admin/listings${status ? `?status=${status}` : ""}`),
  listing: (id: string) => apiClient<{ data: ListingDetail }>(`/admin/listings/${id}`),
  approveListing: (id: string, note?: string) =>
    apiClient(`/admin/listings/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  rejectListing: (id: string, note?: string) =>
    apiClient(`/admin/listings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  cancelListing: (id: string, note?: string) =>
    apiClient(`/admin/listings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  republishListing: (id: string) =>
    apiClient(`/admin/listings/${id}/republish`, { method: "POST" }),
  updateListing: (id: string, body: Partial<ListingRow>) =>
    apiClient(`/admin/listings/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  projects: () => apiClient<{ data: ProjectRow[] }>("/admin/projects"),
  createProject: (body: ProjectForm) =>
    apiClient("/admin/projects", { method: "POST", body: JSON.stringify(body) }),
  updateProject: (id: string, body: Partial<ProjectRow>) =>
    apiClient(`/admin/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProject: (id: string) =>
    apiClient(`/admin/projects/${id}`, { method: "DELETE" }),
  cities: () => apiClient<{ data: CityRow[] }>("/admin/cities"),
  createCity: (body: CityForm) =>
    apiClient("/admin/cities", { method: "POST", body: JSON.stringify(body) }),
  updateCity: (id: string, body: Partial<CityForm>) =>
    apiClient(`/admin/cities/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteCity: (id: string) =>
    apiClient(`/admin/cities/${id}`, { method: "DELETE" }),
  channels: () =>
    apiClient<{ data: ChannelRow[]; summary: ChannelSummary }>("/admin/channels"),
  createChannel: (body: ChannelForm) =>
    apiClient("/admin/channels", { method: "POST", body: JSON.stringify(body) }),
  updateChannel: (id: string, body: Partial<ChannelForm>) =>
    apiClient(`/admin/channels/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteChannel: (id: string) =>
    apiClient(`/admin/channels/${id}`, { method: "DELETE" }),
  publications: (status?: string) =>
    apiClient<{ data: PublicationRow[] }>(
      `/admin/publications${status ? `?status=${status}` : ""}`,
    ),
  retryPublication: (id: string) =>
    apiClient(`/admin/publications/${id}/retry`, { method: "POST" }),
  removePublication: (id: string) =>
    apiClient(`/admin/publications/${id}/remove`, { method: "POST" }),
  pinPublication: (id: string) =>
    apiClient(`/admin/publications/${id}/pin`, { method: "POST" }),
  featurePublication: (id: string) =>
    apiClient(`/admin/publications/${id}/feature`, { method: "POST" }),
  republishPublication: (id: string) =>
    apiClient(`/admin/publications/${id}/republish`, { method: "POST" }),
  payments: () => apiClient<{ data: PaymentRow[] }>("/admin/payments"),
  analytics: () =>
    apiClient<AnalyticsData>("/admin/analytics"),
  users: () => apiClient<{ data: UserRow[] }>("/admin/users"),
  user: (id: string) => apiClient<{ data: UserDetail }>(`/admin/users/${id}`),
  createUser: (body: Partial<UserRow>) =>
    apiClient("/admin/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id: string, body: Partial<UserRow>) =>
    apiClient(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  sendUserMessage: (id: string, body: UserMessagePayload) =>
    apiClient<UserMessageResult>(`/admin/users/${id}/message`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  broadcastUsers: (body: UserBroadcastPayload) =>
    apiClient<UserBroadcastResult>("/admin/users/broadcast", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  vacancyTypes: (projectId?: string) =>
    apiClient<{ data: VacancyTypeRow[] }>(
      `/admin/vacancy-types${projectId ? `?projectId=${projectId}` : ""}`,
    ),
  initVacancyPricing: (projectId: string) =>
    apiClient<{ data: VacancyTypeRow[] }>(
      `/admin/vacancy-types/init/${projectId}`,
      { method: "POST" },
    ),
  updateVacancyType: (id: string, body: Partial<VacancyTypeRow>) =>
    apiClient(`/admin/vacancy-types/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  projectAddons: (projectId?: string) =>
    apiClient<{ data: ProjectAddonRow[] }>(
      `/admin/project-addons${projectId ? `?projectId=${projectId}` : ""}`,
    ),
  initProjectAddons: (projectId: string) =>
    apiClient<{ data: ProjectAddonRow[] }>(
      `/admin/project-addons/init/${projectId}`,
      { method: "POST" },
    ),
  updateProjectAddon: (id: string, body: Partial<ProjectAddonRow>) =>
    apiClient(`/admin/project-addons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  managers: (period?: "7d" | "30d" | "all") =>
    apiClient<{ data: ManagerRow[]; summary: ManagerSummary }>(
      `/admin/managers${period && period !== "all" ? `?period=${period}` : ""}`,
    ),
  createManager: (body: ManagerForm) =>
    apiClient("/admin/managers", { method: "POST", body: JSON.stringify(body) }),
  updateManager: (id: string, body: Partial<ManagerForm>) =>
    apiClient(`/admin/managers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteManager: (id: string) =>
    apiClient(`/admin/managers/${id}`, { method: "DELETE" }),
  telegramSettings: (projectId: string) =>
    apiClient<{ data: TelegramSettings }>(`/admin/settings/telegram?projectId=${projectId}`),
  saveTelegramSettings: (body: TelegramSettingsForm) =>
    apiClient<{ data: TelegramSettings }>("/admin/settings/telegram", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  registerTelegramWebhook: (projectId: string) =>
    apiClient<{ ok: boolean; webhookUrl: string }>("/admin/settings/telegram/webhook", {
      method: "POST",
      body: JSON.stringify({ projectId }),
    }),
  branding: () => apiClient<{ data: BrandingSettings }>("/admin/settings/branding"),
  saveBranding: (body: { brandName: string }) =>
    apiClient<{ data: BrandingSettings }>("/admin/settings/branding", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  uploadBrandingLogo: (dataUrl: string) =>
    apiClient<{ data: BrandingSettings }>("/admin/settings/branding/logo", {
      method: "POST",
      body: JSON.stringify({ dataUrl }),
    }),
};

export interface ModerationSummary {
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  paymentConfirmedBy: string | null;
  paymentConfirmedAt: string | null;
  republishedBy: string | null;
  republishedAt: string | null;
}

export interface ModerationLogEntry {
  id: string;
  action: string;
  actionLabel: string;
  note?: string | null;
  moderatorName: string;
  createdAt: string;
}

export interface ListingRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  price?: number;
  currency?: string;
  contactPhone?: string;
  project: string;
  projectId?: string;
  projectSlug?: string;
  category?: string;
  city?: string | null;
  userName?: string;
  userPhone?: string;
  sourceChannel: string;
  createdAt: string;
  moderation?: ModerationSummary;
}

export interface ListingDetail extends ListingRow {
  project?: string | { name: string; slug?: string };
  category?: string | { name: string; slug?: string };
  city?: string | null | { name: string; slug?: string };
  user?: { name?: string | null; phone?: string | null };
  media?: { id: string; url: string; sortOrder?: number }[];
  moderationLogs?: ModerationLogEntry[];
}

export interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface ProjectForm {
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface ChannelDailyStat {
  date: string;
  publications: number;
  revenue: number;
}

export interface ChannelStats {
  publicationsTotal: number;
  publicationsPublished: number;
  publicationsToday: number;
  publicationsMonth: number;
  revenueTotal: number;
  revenueToday: number;
  revenueMonth: number;
  daily: ChannelDailyStat[];
}

export interface ChannelSummary {
  totalChannels: number;
  activeChannels: number;
  publicationsToday: number;
  publicationsMonth: number;
  revenueToday: number;
  revenueMonth: number;
  revenueTotal: number;
}

export interface ChannelRow {
  id: string;
  projectId: string;
  type: string;
  purpose?: string;
  name?: string | null;
  project: string;
  isActive: boolean;
  isGlobal: boolean;
  cities: { id: string; name: string; slug: string }[];
  config: Record<string, unknown>;
  stats?: ChannelStats;
}

export interface ChannelForm {
  projectId: string;
  channel: string;
  purpose?: string;
  name?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
  isGlobal?: boolean;
  cityIds?: string[];
}

export interface CityRow {
  id: string;
  name: string;
  slug: string;
  regionId: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CityForm {
  regionId?: string;
  name: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface PublicationRow {
  id: string;
  status: string;
  externalId?: string | null;
  errorMessage?: string | null;
  publishedAt?: string | null;
  removedAt?: string | null;
  removedByName?: string | null;
  createdAt: string;
  listingId: string;
  listingTitle?: string | null;
  listingIsPinned?: boolean;
  listingBoostScore?: number;
  approvedByName?: string | null;
  channel: string;
  purpose: string;
  project: string;
  projectId?: string;
}

export interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

export interface AnalyticsDailyRow {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
}

export interface AnalyticsData {
  views: number;
  clicks: number;
  conversions: number;
  payments: number;
  revenue: number;
  daily: AnalyticsDailyRow[];
}

export interface UserRow {
  id: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  channel: string;
  telegramId?: string | null;
  viberId?: string | null;
  whatsappId?: string | null;
  listingsCount: number;
  publishedCount?: number;
  totalSpent?: number;
  createdAt?: string;
}

export interface UserDetail extends UserRow {
  locale?: string;
  phoneVerifiedAt?: string | null;
  updatedAt?: string;
  stats: {
    listingsTotal: number;
    listingsPublished: number;
    listingsPending: number;
    listingsDraft: number;
    listingsRejected: number;
    totalSpent: number;
    paymentsCount: number;
    boostsCount: number;
    publicationsCount: number;
  };
  listings: UserListingRow[];
  payments: UserPaymentRow[];
  boosts: UserBoostRow[];
}

export interface UserListingRow {
  id: string;
  title: string | null;
  status: string;
  price: number | null;
  currency: string;
  sourceChannel: string | null;
  isPinned: boolean;
  boostScore: number;
  publishedAt: string | null;
  createdAt: string;
  projectName: string;
  projectSlug: string;
  categoryName: string;
  cityName: string | null;
}

export interface UserPaymentRow {
  id: string;
  listingId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
  listingTitle: string | null;
}

export interface UserBoostRow {
  id: string;
  type: string;
  price: number;
  currency: string;
  startsAt: string;
  endsAt: string;
  listingId: string;
  listingTitle: string | null;
}

export type MessengerChannel = "telegram" | "viber" | "whatsapp";

export interface UserMessagePayload {
  message: string;
  channel?: MessengerChannel;
}

export interface UserMessageResult {
  userId: string;
  userName: string | null;
  channel: MessengerChannel;
  ok: boolean;
  error?: string;
}

export interface UserBroadcastPayload {
  message: string;
  userIds?: string[];
  channel?: MessengerChannel | "all";
}

export interface UserBroadcastResult {
  sent: number;
  failed: number;
  total: number;
  results: UserMessageResult[];
}

export interface PricingRow {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  listingQuota: number;
  isActive: boolean;
}

export interface VacancyTypeRow {
  id: string;
  projectId: string;
  projectName: string;
  slug: string;
  name: string;
  vacancyCount: number;
  price: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ProjectAddonRow {
  id: string;
  projectId: string;
  projectName: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  billingUnit: "fixed" | "per_vacancy";
  sortOrder: number;
  isActive: boolean;
}

export interface ManagerStats {
  approved: number;
  rejected: number;
  totalModerated: number;
  removedPublications: number;
  approvalRate: number | null;
  lastActivity: string | null;
}

export interface ManagerSummary {
  totalManagers: number;
  activeManagers: number;
  totalModerated: number;
  avgApprovalRate: number | null;
  period: "7d" | "30d" | "all";
}

export interface ManagerRow {
  id: string;
  email: string;
  name: string;
  role: "manager" | "super_admin";
  isActive: boolean;
  projects: { id: string; name: string }[];
  createdAt: string;
  stats: ManagerStats;
}

export interface ManagerForm {
  email: string;
  password: string;
  name: string;
  role?: "manager" | "super_admin";
  projectIds?: string[];
  isActive?: boolean;
}

export interface TelegramSettings {
  projectId: string;
  projectName: string;
  botToken: string;
  webhookUrl: string;
  isActive: boolean;
  botUsername: string | null;
  supportMessage: string;
  siteUrl: string;
  supportLabel: string;
  siteLabel: string;
  channelsLabel: string;
  showSupport: boolean;
  showSite: boolean;
  showChannels: boolean;
  pinPrice: number;
  dailyDuplicatePrice: number;
  adminChatId: string;
  adminGroupEnabled: boolean;
  notifySubmittedPayment: boolean;
  notifySubmittedModeration: boolean;
  notifyPaymentReceived: boolean;
  notifyResubmitted: boolean;
  notifyModerationActions: boolean;
}

export interface TelegramSettingsForm {
  projectId: string;
  botToken?: string;
  webhookUrl?: string;
  isActive?: boolean;
  supportMessage?: string;
  siteUrl?: string;
  supportLabel?: string;
  siteLabel?: string;
  channelsLabel?: string;
  showSupport?: boolean;
  showSite?: boolean;
  showChannels?: boolean;
  pinPrice?: number;
  dailyDuplicatePrice?: number;
  adminChatId?: string;
  adminGroupEnabled?: boolean;
  notifySubmittedPayment?: boolean;
  notifySubmittedModeration?: boolean;
  notifyPaymentReceived?: boolean;
  notifyResubmitted?: boolean;
  notifyModerationActions?: boolean;
}

export interface BrandingSettings {
  brandName: string;
  logoUrl: string;
}
