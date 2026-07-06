export enum ListingStatus {
  DRAFT = "draft",
  PENDING_PAYMENT = "pending_payment",
  PENDING_MODERATION = "pending_moderation",
  APPROVED = "approved",
  PUBLISHING = "publishing",
  PUBLISHED = "published",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export enum ChannelType {
  TELEGRAM = "telegram",
  VIBER = "viber",
  WHATSAPP = "whatsapp",
  INSTAGRAM = "instagram",
  WEB = "web",
}

export type BotChannel = "telegram" | "viber" | "whatsapp";

export enum ChannelPurpose {
  LISTING_INPUT = "listing_input",
  PUBLICATION = "publication",
}

export enum PaymentMethod {
  MONOPAY = "monopay",
  PORTMONE = "portmone",
  BANK_TRANSFER = "bank_transfer",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum BoostType {
  VIP = "vip",
  PIN = "pin",
  FEATURED = "featured",
  COMBO = "combo",
}

export enum PublicationStatus {
  PENDING = "pending",
  PUBLISHED = "published",
  FAILED = "failed",
}

export enum ModerationAction {
  APPROVE = "approve",
  REJECT = "reject",
  REQUEST_CHANGES = "request_changes",
}

export enum BotStep {
  SELECT_PROJECT = "SELECT_PROJECT",
  SELECT_CATEGORY = "SELECT_CATEGORY",
  SELECT_CITY = "SELECT_CITY",
  ADD_POSITIONS = "ADD_POSITIONS",
  ENTER_DETAILS = "ENTER_DETAILS",
  UPLOAD_MEDIA = "UPLOAD_MEDIA",
  CONFIRM_PREVIEW = "CONFIRM_PREVIEW",
  PAYMENT = "PAYMENT",
  SUBMITTED = "SUBMITTED",
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  projectId: string;
  parentId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface City {
  id: string;
  regionId: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  name: string | null;
  telegramId: string | null;
  viberId: string | null;
  whatsappId: string | null;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  priceMonthly: number;
  listingQuota: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  listingsUsed: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Listing {
  id: string;
  projectId: string;
  categoryId: string;
  cityId: string | null;
  userId: string;
  status: ListingStatus;
  title: string | null;
  description: string | null;
  price: number | null;
  currency: string;
  contactPhone: string | null;
  boostScore: number;
  isPinned: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingPosition {
  id: string;
  listingId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface ListingMedia {
  id: string;
  listingId: string;
  url: string;
  mimeType: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface ListingBoost {
  id: string;
  listingId: string;
  type: BoostType;
  price: number;
  currency: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}

export interface ChannelConfig {
  id: string;
  projectId: string;
  channel: ChannelType;
  purpose: ChannelPurpose;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelPublication {
  id: string;
  listingId: string;
  channelConfigId: string;
  status: PublicationStatus;
  externalId: string | null;
  errorMessage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface ProjectChannelCity {
  id: string;
  projectId: string;
  channelConfigId: string;
  cityId: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  listingId: string | null;
  userId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string | null;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  paidAt: Date | null;
  createdAt: Date;
}

export interface ModerationLog {
  id: string;
  listingId: string;
  moderatorId: string;
  action: ModerationAction;
  note: string | null;
  createdAt: Date;
}

export interface AnalyticsEvent {
  id: string;
  projectId: string | null;
  listingId: string | null;
  channel: ChannelType | null;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface DailyStats {
  id: string;
  projectId: string;
  date: Date;
  metrics: Record<string, unknown>;
  createdAt: Date;
}

export interface BotPosition {
  title: string;
  experience?: string;
  salary?: string;
  schedule?: string;
  workTime?: string;
  description?: string;
  /** @deprecated mapped from schedule + workTime */
  workingHours?: string;
  price?: number;
  vacancyTypeId?: string;
}

export enum HorecaStep {
  SELECT_CITY = "SELECT_CITY",
  SELECT_DISTRICT = "SELECT_DISTRICT",
  BUSINESS_TYPE = "BUSINESS_TYPE",
  BUSINESS_NAME = "BUSINESS_NAME",
  ADDRESS = "ADDRESS",
  VACANCY_COUNT = "VACANCY_COUNT",
  VACANCY_TITLE = "VACANCY_TITLE",
  VACANCY_EXPERIENCE = "VACANCY_EXPERIENCE",
  VACANCY_SALARY = "VACANCY_SALARY",
  VACANCY_SCHEDULE = "VACANCY_SCHEDULE",
  VACANCY_TIME = "VACANCY_TIME",
  VACANCY_DESCRIPTION = "VACANCY_DESCRIPTION",
  BENEFITS = "BENEFITS",
  CONTACT = "CONTACT",
  UPLOAD_PHOTOS = "UPLOAD_PHOTOS",
  PIN_POST = "PIN_POST",
  SCHEDULE_POST = "SCHEDULE_POST",
  DAILY_DUPLICATE = "DAILY_DUPLICATE",
  PREVIEW = "PREVIEW",
  EDIT_MENU = "EDIT_MENU",
}

export interface BotSession {
  userId: string;
  channel: BotChannel;
  state: BotStep;
  flow?: "horeca" | "jobs" | "browse_jobs" | "default";
  horecaStep?: HorecaStep;
  updatedAt: string;
  projectId?: string;
  categoryId?: string;
  cityId?: string;
  districtId?: string;
  businessType?: string;
  address?: string;
  vacancyCount?: number;
  vacancyIndex?: number;
  vacancies?: BotPosition[];
  bundlePrice?: number;
  bundlePriceId?: string;
  positions?: string[];
  title?: string;
  description?: string;
  /** Listing benefits (bullet list in published post) */
  benefits?: string;
  price?: number;
  contactPhone?: string;
  mediaUrls?: string[];
  pinPost?: boolean;
  scheduledPostAt?: string;
  dailyDuplicate?: boolean;
  requiresPayment?: boolean;
  listingId?: string;
  /** When editing existing listing — which field is being changed */
  editTarget?: string;
}
