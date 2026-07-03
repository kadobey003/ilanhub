import { PUBLIC_API_URL } from "./api-url";

export type AnalyticsEventType = "view" | "click" | "conversion";

export interface TrackAnalyticsPayload {
  eventType: AnalyticsEventType;
  projectId: string;
  listingId: string;
  channel?: "web";
  metadata?: Record<string, unknown>;
}

export function trackAnalyticsEvent(payload: TrackAnalyticsPayload): void {
  const url = `${PUBLIC_API_URL}/api/analytics/events`;
  const body = JSON.stringify({ ...payload, channel: payload.channel ?? "web" });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(url, blob)) return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
