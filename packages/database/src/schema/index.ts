import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending_payment",
  "pending_moderation",
  "approved",
  "publishing",
  "published",
  "rejected",
  "expired",
]);

export const channelTypeEnum = pgEnum("channel_type", [
  "telegram",
  "viber",
  "whatsapp",
  "instagram",
  "web",
]);

export const channelPurposeEnum = pgEnum("channel_purpose", [
  "listing_input",
  "publication",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "monopay",
  "portmone",
  "bank_transfer",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const boostTypeEnum = pgEnum("boost_type", [
  "vip",
  "pin",
  "featured",
  "combo",
]);

export const addonBillingUnitEnum = pgEnum("addon_billing_unit", [
  "fixed",
  "per_vacancy",
]);

export const publicationStatusEnum = pgEnum("publication_status", [
  "pending",
  "published",
  "failed",
  "removed",
]);

export const moderationActionEnum = pgEnum("moderation_action", [
  "approve",
  "reject",
  "request_changes",
]);

export const adminRoleEnum = pgEnum("admin_role", ["manager", "super_admin"]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("projects_slug_idx").on(t.slug)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_project_slug_idx").on(t.projectId, t.slug),
    index("categories_project_idx").on(t.projectId),
  ],
);

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("regions_slug_idx").on(t.slug)],
);

export const cities = pgTable(
  "cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("cities_region_slug_idx").on(t.regionId, t.slug),
    index("cities_region_idx").on(t.regionId),
  ],
);

export const districts = pgTable(
  "districts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    uniqueIndex("districts_city_slug_idx").on(t.cityId, t.slug),
    index("districts_city_idx").on(t.cityId),
  ],
);

export const vacancyTypes = pgTable(
  "vacancy_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    vacancyCount: integer("vacancy_count").notNull().default(1),
    price: integer("price").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("vacancy_types_project_slug_idx").on(t.projectId, t.slug),
    uniqueIndex("vacancy_types_project_count_idx").on(t.projectId, t.vacancyCount),
    index("vacancy_types_project_idx").on(t.projectId),
  ],
);

export const projectAddons = pgTable(
  "project_addons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: integer("price").notNull().default(0),
    billingUnit: addonBillingUnitEnum("billing_unit")
      .notNull()
      .default("fixed"),
    currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("project_addons_project_slug_idx").on(t.projectId, t.slug),
    index("project_addons_project_idx").on(t.projectId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
    name: varchar("name", { length: 255 }),
    telegramId: varchar("telegram_id", { length: 64 }),
    viberId: varchar("viber_id", { length: 64 }),
    whatsappId: varchar("whatsapp_id", { length: 64 }),
    locale: varchar("locale", { length: 8 }).notNull().default("uk"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_phone_idx").on(t.phone),
    uniqueIndex("users_telegram_idx").on(t.telegramId),
    uniqueIndex("users_viber_idx").on(t.viberId),
    uniqueIndex("users_whatsapp_idx").on(t.whatsappId),
  ],
);

export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    priceMonthly: integer("price_monthly").notNull(),
    listingQuota: integer("listing_quota").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("subscription_plans_slug_idx").on(t.slug)],
);

export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id),
    listingsUsed: integer("listings_used").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("user_subscriptions_user_idx").on(t.userId),
    index("user_subscriptions_active_idx").on(t.userId, t.isActive),
  ],
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    cityId: uuid("city_id").references(() => cities.id),
    districtId: uuid("district_id").references(() => districts.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: listingStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 500 }),
    businessType: varchar("business_type", { length: 128 }),
    address: text("address"),
    description: text("description"),
    price: integer("price"),
    currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
    contactPhone: varchar("contact_phone", { length: 32 }),
    boostScore: integer("boost_score").notNull().default(0),
    isPinned: boolean("is_pinned").notNull().default(false),
    sourceChannel: channelTypeEnum("source_channel"),
    sourceStep: varchar("source_step", { length: 64 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("listings_project_status_idx").on(t.projectId, t.status),
    index("listings_city_idx").on(t.cityId),
    index("listings_user_idx").on(t.userId),
    index("listings_published_idx").on(t.publishedAt),
  ],
);

export const listingPositions = pgTable(
  "listing_positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    vacancyTypeId: uuid("vacancy_type_id").references(() => vacancyTypes.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    salary: varchar("salary", { length: 128 }),
    workingHours: varchar("working_hours", { length: 128 }),
    price: integer("price"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("listing_positions_listing_idx").on(t.listingId)],
);

export const listingMedia = pgTable(
  "listing_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    mimeType: varchar("mime_type", { length: 128 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("listing_media_listing_idx").on(t.listingId)],
);

export const listingBoosts = pgTable(
  "listing_boosts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    type: boostTypeEnum("type").notNull(),
    price: integer("price").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("listing_boosts_listing_idx").on(t.listingId),
    index("listing_boosts_active_idx").on(t.endsAt),
  ],
);

export const channelConfigs = pgTable(
  "channel_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    channel: channelTypeEnum("channel").notNull(),
    purpose: channelPurposeEnum("purpose").notNull(),
    name: varchar("name", { length: 255 }),
    config: jsonb("config").notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("channel_configs_project_idx").on(t.projectId)],
);

export const channelPublications = pgTable(
  "channel_publications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    channelConfigId: uuid("channel_config_id")
      .notNull()
      .references(() => channelConfigs.id),
    status: publicationStatusEnum("status").notNull().default("pending"),
    externalId: varchar("external_id", { length: 255 }),
    errorMessage: text("error_message"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    removedByAdminId: uuid("removed_by_admin_id").references(
      () => adminManagers.id,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("channel_publications_listing_idx").on(t.listingId),
    uniqueIndex("channel_publications_listing_channel_idx").on(
      t.listingId,
      t.channelConfigId,
    ),
  ],
);

export const projectChannelCities = pgTable(
  "project_channel_cities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    channelConfigId: uuid("channel_config_id")
      .notNull()
      .references(() => channelConfigs.id, { onDelete: "cascade" }),
    cityId: uuid("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("project_channel_cities_unique_idx").on(
      t.channelConfigId,
      t.cityId,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").references(() => listings.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("UAH"),
    reference: varchar("reference", { length: 64 }),
    externalId: varchar("external_id", { length: 255 }),
    metadata: jsonb("metadata").default({}),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_reference_idx").on(t.reference),
    index("payments_user_idx").on(t.userId),
    index("payments_listing_idx").on(t.listingId),
  ],
);

export const moderationLogs = pgTable(
  "moderation_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    moderatorId: uuid("moderator_id")
      .notNull()
      .references(() => users.id),
    action: moderationActionEnum("action").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("moderation_logs_listing_idx").on(t.listingId)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").references(() => projects.id),
    listingId: uuid("listing_id").references(() => listings.id),
    channel: channelTypeEnum("channel"),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("analytics_events_project_idx").on(t.projectId),
    index("analytics_events_listing_idx").on(t.listingId),
    index("analytics_events_created_idx").on(t.createdAt),
  ],
);

export const adminManagers = pgTable(
  "admin_managers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: adminRoleEnum("role").notNull().default("manager"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("admin_managers_email_idx").on(t.email)],
);

export const adminManagerProjects = pgTable(
  "admin_manager_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    managerId: uuid("manager_id")
      .notNull()
      .references(() => adminManagers.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("admin_manager_projects_unique_idx").on(
      t.managerId,
      t.projectId,
    ),
  ],
);

export const dailyStats = pgTable(
  "daily_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    metrics: jsonb("metrics").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("daily_stats_project_date_idx").on(t.projectId, t.date),
  ],
);
