const API_URL = process.env.API_URL ?? "http://localhost:3000";
const WA_TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";

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

export async function sendWhatsAppMessage(
  to: string,
  text: string,
  buttons?: { type: string; reply: { id: string; title: string } }[],
): Promise<void> {
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };
  if (buttons?.length) {
    body.type = "interactive";
    body.interactive = {
      type: "button",
      body: { text },
      action: { buttons: buttons.slice(0, 3) },
    };
    delete body.text;
  }
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
