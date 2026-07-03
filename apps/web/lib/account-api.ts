import { PUBLIC_API_URL } from "./api-url";
import { getToken } from "./auth";
import type { AuthUser } from "./auth-api";

async function accountFetch<T>(path: string): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message ?? `API ${res.status}`);
  }
  return json as T;
}

export interface DashboardData {
  user: AuthUser;
  stats: {
    total: number;
    published: number;
    pending: number;
    draft: number;
  };
  recent: {
    id: string;
    title: string | null;
    status: string;
    price: number | null;
    currency: string;
    project: string;
    createdAt: string;
  }[];
}

export interface UserListing {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  price: number | null;
  currency: string;
  project: string;
  projectSlug: string;
  createdAt: string;
  publishedAt: string | null;
}

export const accountApi = {
  dashboard: () => accountFetch<DashboardData>("/api/account/dashboard"),
  listings: () => accountFetch<{ data: UserListing[] }>("/api/account/listings"),
};
