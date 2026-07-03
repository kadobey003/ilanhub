import type { AuthUser } from "./auth-api";

const TOKEN_KEY = "ilanhub_token";
const USER_KEY = "ilanhub_user";

export function saveSession(accessToken: string, user?: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function redirectAfterAuth(from: string) {
  const target =
    from && from.startsWith("/") && !from.startsWith("/login") && !from.startsWith("/register")
      ? from
      : "/account";
  window.location.href = target;
}
