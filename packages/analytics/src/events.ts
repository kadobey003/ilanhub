export const AnalyticsEventType = {
  VIEW: "view",
  CLICK: "click",
  CONVERSION: "conversion",
  PAYMENT: "payment",
} as const;

export type AnalyticsEventTypeName =
  (typeof AnalyticsEventType)[keyof typeof AnalyticsEventType];

export interface AnalyticsEventPayload {
  eventType: AnalyticsEventTypeName;
  projectId?: string;
  listingId?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface ViewEvent extends AnalyticsEventPayload {
  eventType: typeof AnalyticsEventType.VIEW;
  metadata?: { source?: string; duration?: number };
}

export interface ClickEvent extends AnalyticsEventPayload {
  eventType: typeof AnalyticsEventType.CLICK;
  metadata?: { target?: string; element?: string };
}

export interface ConversionEvent extends AnalyticsEventPayload {
  eventType: typeof AnalyticsEventType.CONVERSION;
  metadata?: { action?: string; funnel?: string };
}

export interface PaymentEvent extends AnalyticsEventPayload {
  eventType: typeof AnalyticsEventType.PAYMENT;
  metadata?: { amount?: number; currency?: string; method?: string };
}

export type AnalyticsEvent =
  | ViewEvent
  | ClickEvent
  | ConversionEvent
  | PaymentEvent;

export interface DailyMetrics {
  views: number;
  clicks: number;
  conversions: number;
  payments: number;
  revenue: number;
  byChannel: Record<string, { views: number; clicks: number }>;
}

export interface DailyStatsRow {
  projectId: string;
  date: string;
  metrics: DailyMetrics;
}
