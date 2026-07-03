import type { AnalyticsEvent, AnalyticsEventPayload } from "./events.js";

export type EventSink = (event: AnalyticsEvent) => void | Promise<void>;

let sink: EventSink = () => {};

export function setEventSink(newSink: EventSink): void {
  sink = newSink;
}

export async function trackEvent(
  payload: AnalyticsEventPayload,
): Promise<AnalyticsEvent> {
  const event: AnalyticsEvent = {
    ...payload,
    timestamp: payload.timestamp ?? new Date(),
  } as AnalyticsEvent;

  await sink(event);
  return event;
}

export function trackView(
  projectId: string,
  listingId: string,
  channel?: string,
  metadata?: Record<string, unknown>,
): Promise<AnalyticsEvent> {
  return trackEvent({
    eventType: "view",
    projectId,
    listingId,
    channel,
    metadata,
  });
}

export function trackClick(
  projectId: string,
  listingId: string,
  channel?: string,
  metadata?: Record<string, unknown>,
): Promise<AnalyticsEvent> {
  return trackEvent({
    eventType: "click",
    projectId,
    listingId,
    channel,
    metadata,
  });
}

export function trackConversion(
  projectId: string,
  listingId: string,
  metadata?: Record<string, unknown>,
): Promise<AnalyticsEvent> {
  return trackEvent({
    eventType: "conversion",
    projectId,
    listingId,
    metadata,
  });
}

export function trackPayment(
  projectId: string,
  metadata: { amount: number; currency: string; method: string },
  listingId?: string,
): Promise<AnalyticsEvent> {
  return trackEvent({
    eventType: "payment",
    projectId,
    listingId,
    metadata,
  });
}
