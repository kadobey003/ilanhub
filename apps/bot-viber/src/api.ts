const API_URL = process.env.API_URL ?? "http://localhost:3000";
const VIBER_TOKEN = process.env.VIBER_AUTH_TOKEN ?? "";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  getProjects: () => apiFetch<{ data: import("@ilanhub/shared").ApiProject[] }>("/api/projects"),
  getCategories: (projectId: string) =>
    apiFetch<{ data: import("@ilanhub/shared").ApiCategory[] }>(`/api/projects/${projectId}/categories`),
  getCities: (projectId: string) =>
    apiFetch<{ data: import("@ilanhub/shared").ApiCity[] }>(`/api/projects/${projectId}/cities`),
  submitListing: (id: string) => apiFetch(`/api/listings/${id}/submit`, { method: "POST" }),
};

export async function sendViberMessage(
  receiver: string,
  text: string,
  keyboard?: { Type: string; Buttons: unknown[] },
): Promise<void> {
  await fetch("https://chatapi.viber.com/pa/send_message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Viber-Auth-Token": VIBER_TOKEN,
    },
    body: JSON.stringify({
      receiver,
      type: "text",
      text,
      keyboard,
      min_api_version: 7,
    }),
  });
}
