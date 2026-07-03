import { PUBLIC_API_URL } from "./api-url";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { message?: string }).message ?? `API error ${res.status}`,
    );
  }
  return json as T;
}

export interface AuthUser {
  id: string;
  phone: string | null;
  name: string | null;
  telegramId: string | null;
  phoneVerified: boolean;
  locale: string;
}

export const authApi = {
  register: (phone: string, name: string) =>
    request<{
      linkToken: string;
      telegramUrl: string;
      expiresIn: number;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ phone, name }),
    }),

  linkStatus: (token: string) =>
    request<{
      status: "pending" | "verified" | "expired";
      accessToken?: string;
      user?: AuthUser;
    }>(`/api/auth/link/${token}/status`),

  loginRequest: (phone: string) =>
    request<{
      expiresIn: number;
      devCode?: string;
      telegramHint?: string;
    }>("/api/auth/login/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  loginVerify: (phone: string, code: string) =>
    request<{ accessToken: string; user: AuthUser }>("/api/auth/login/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    }),

  devLogin: () =>
    request<{ accessToken: string; user: AuthUser }>("/api/auth/login/dev", {
      method: "POST",
    }),

  me: (token: string) =>
    request<{ user: AuthUser }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
