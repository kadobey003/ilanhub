import { AnalyticsEventType, type AnalyticsEvent, type DailyMetrics, type DailyStatsRow } from "./events.js";

function emptyMetrics(): DailyMetrics {
  return {
    views: 0,
    clicks: 0,
    conversions: 0,
    payments: 0,
    revenue: 0,
    byChannel: {},
  };
}

function ensureChannel(metrics: DailyMetrics, channel: string): void {
  if (!metrics.byChannel[channel]) {
    metrics.byChannel[channel] = { views: 0, clicks: 0 };
  }
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function aggregateDailyStats(
  events: AnalyticsEvent[],
  projectId: string,
  date: Date,
): DailyStatsRow {
  const metrics = emptyMetrics();
  const targetDate = dateKey(date);

  for (const event of events) {
    if (event.projectId && event.projectId !== projectId) continue;

    const eventDate = dateKey(event.timestamp ?? new Date());
    if (eventDate !== targetDate) continue;

    const channel = event.channel ?? "unknown";
    ensureChannel(metrics, channel);

    switch (event.eventType) {
      case AnalyticsEventType.VIEW:
        metrics.views++;
        metrics.byChannel[channel]!.views++;
        break;
      case AnalyticsEventType.CLICK:
        metrics.clicks++;
        metrics.byChannel[channel]!.clicks++;
        break;
      case AnalyticsEventType.CONVERSION:
        metrics.conversions++;
        break;
      case AnalyticsEventType.PAYMENT:
        metrics.payments++;
        if (typeof event.metadata?.amount === "number") {
          metrics.revenue += event.metadata.amount;
        }
        break;
    }
  }

  return {
    projectId,
    date: targetDate,
    metrics,
  };
}

export function aggregateDailyStatsBatch(
  events: AnalyticsEvent[],
  projectIds: string[],
  date: Date,
): DailyStatsRow[] {
  return projectIds.map((projectId) =>
    aggregateDailyStats(events, projectId, date),
  );
}
