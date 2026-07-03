import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, sql, sum } from "drizzle-orm";
import type { Queue } from "bullmq";
import {
  adminManagerProjects,
  adminManagers,
  analyticsEvents,
  categories,
  channelConfigs,
  channelPublications,
  cities,
  listings,
  listingBoosts,
  listingMedia,
  moderationLogs,
  payments,
  projectChannelCities,
  projects,
  projectAddons,
  regions,
  users,
  vacancyTypes,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE, PUBLISH_LISTING_QUEUE } from "../common/constants.js";
import type { PublishListingJob } from "../queue/queue.module.js";
import { slugify } from "@ilanhub/shared";
import { hashPassword } from "./password.util.js";
import {
  deleteTelegramMessage,
  parseTelegramExternalId,
  pinTelegramMessage,
  resolveTelegramBotToken,
} from "./telegram-channel.util.js";
import type {
  AdminListingUpdateDto,
  AdminManagerCreateDto,
  AdminManagerUpdateDto,
  AdminUserCreateDto,
  AdminUserUpdateDto,
  ChannelCreateDto,
  ChannelUpdateDto,
  CityCreateDto,
  CityUpdateDto,
  ModerationNoteDto,
  RegionCreateDto,
  RegionUpdateDto,
  PricingUpdateDto,
  ProjectPricingDto,
  ProjectCreateDto,
  TelegramSettingsDto,
  CategoryCreateDto,
  CategoryUpdateDto,
} from "./dto/admin.dto.js";
import { UserMessagingService } from "./user-messaging.service.js";

function detectChannel(user: {
  telegramId: string | null;
  viberId: string | null;
  whatsappId: string | null;
}) {
  if (user.telegramId) return "telegram";
  if (user.viberId) return "viber";
  if (user.whatsappId) return "whatsapp";
  return "web";
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(PUBLISH_LISTING_QUEUE)
    private readonly publishQueue: Queue<PublishListingJob>,
    private readonly userMessaging: UserMessagingService,
  ) {}

  private async moderatorId(adminId?: string): Promise<string> {
    if (adminId) {
      const [asUser] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);
      if (asUser) return asUser.id;

      const [manager] = await this.db
        .select()
        .from(adminManagers)
        .where(eq(adminManagers.id, adminId))
        .limit(1);
      if (manager) {
        const [byEmail] = await this.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, manager.email))
          .limit(1);
        if (byEmail) return byEmail.id;

        const [created] = await this.db
          .insert(users)
          .values({ name: manager.name, email: manager.email })
          .returning();
        return created!.id;
      }
    }

    if (process.env.ADMIN_MODERATOR_ID) {
      const [envUser] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, process.env.ADMIN_MODERATOR_ID))
        .limit(1);
      if (envUser) return envUser.id;
    }

    const [user] = await this.db.select({ id: users.id }).from(users).limit(1);
    if (user) return user.id;

    const [created] = await this.db
      .insert(users)
      .values({ name: "Admin", email: "admin@ilanhub.local" })
      .returning();
    return created!.id;
  }

  /** null = усі проєкти (super_admin), [] = немає доступу */
  private async managerProjectScope(
    adminId?: string,
    adminRole?: string,
  ): Promise<string[] | null> {
    if (!adminId || adminRole === "super_admin") return null;
    const rows = await this.db
      .select({ projectId: adminManagerProjects.projectId })
      .from(adminManagerProjects)
      .where(eq(adminManagerProjects.managerId, adminId));
    return rows.map((r) => r.projectId);
  }

  private async assertListingAccess(
    listingId: string,
    adminId?: string,
    adminRole?: string,
  ) {
    const scope = await this.managerProjectScope(adminId, adminRole);
    if (scope === null) return;
    const [row] = await this.db
      .select({ projectId: listings.projectId })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!row || !scope.includes(row.projectId)) {
      throw new ForbiddenException("Немає доступу до цього оголошення");
    }
  }

  async dashboard() {
    const [pending] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.status, "pending_moderation"));

    const [published] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.status, "published"));

    const [revenue] = await this.db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "completed"));

    const [usersCount] = await this.db.select({ c: count() }).from(users);

    return {
      pending: pending?.c ?? 0,
      published: published?.c ?? 0,
      revenue: Number(revenue?.total ?? 0),
      users: usersCount?.c ?? 0,
    };
  }

  async listListings(status?: string, adminId?: string, adminRole?: string) {
    const scope = await this.managerProjectScope(adminId, adminRole);
    if (scope !== null && scope.length === 0) return { data: [] };

    const base = this.db
      .select({
        listing: listings,
        project: projects,
        category: categories,
        city: cities,
        user: users,
      })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(cities, eq(listings.cityId, cities.id));

    const filters = [];
    if (status) {
      filters.push(
        eq(listings.status, status as (typeof listings.$inferSelect)["status"]),
      );
    }
    if (scope !== null) {
      filters.push(inArray(listings.projectId, scope));
    }

    const rows = await (filters.length
      ? base.where(and(...filters))
      : base
    ).orderBy(desc(listings.createdAt));

    return {
      data: rows.map((r) => ({
        id: r.listing.id,
        title: r.listing.title,
        description: r.listing.description,
        status: r.listing.status,
        price: r.listing.price,
        currency: r.listing.currency,
        contactPhone: r.listing.contactPhone,
        project: r.project.name,
        projectId: r.project.id,
        projectSlug: r.project.slug,
        category: r.category.name,
        city: r.city?.name ?? null,
        userId: r.user.id,
        userName: r.user.name,
        userPhone: r.user.phone,
        sourceChannel: detectChannel(r.user),
        createdAt: r.listing.createdAt,
        updatedAt: r.listing.updatedAt,
      })),
    };
  }

  async getListing(id: string, adminId?: string, adminRole?: string) {
    await this.assertListingAccess(id, adminId, adminRole);
    const [row] = await this.db
      .select({
        listing: listings,
        project: projects,
        category: categories,
        city: cities,
        user: users,
      })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .innerJoin(users, eq(listings.userId, users.id))
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .where(eq(listings.id, id))
      .limit(1);

    if (!row) throw new NotFoundException("Listing not found");

    const media = await this.db
      .select()
      .from(listingMedia)
      .where(eq(listingMedia.listingId, id));

    const logs = await this.db
      .select()
      .from(moderationLogs)
      .where(eq(moderationLogs.listingId, id))
      .orderBy(desc(moderationLogs.createdAt));

    return {
      data: {
        ...row.listing,
        project: row.project,
        category: row.category,
        city: row.city,
        user: row.user,
        sourceChannel: detectChannel(row.user),
        media,
        moderationLogs: logs,
      },
    };
  }

  async approveListing(id: string, dto: ModerationNoteDto, adminId?: string, adminRole?: string) {
    await this.assertListingAccess(id, adminId, adminRole);
    const moderatorId = await this.moderatorId(adminId);
    await this.db.insert(moderationLogs).values({
      listingId: id,
      moderatorId,
      action: "approve",
      note: dto.note,
    });

    const [row] = await this.db
      .update(listings)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    if (!row) throw new NotFoundException("Listing not found");
    try {
      await this.publishQueue.add("publish", { listingId: id });
    } catch {
      // Queue optional in dev — listing still approved
    }
    void this.userMessaging.notifyListingModeration(
      { userId: row.userId, title: row.title },
      "approve",
      dto.note,
    );
    return { data: row };
  }

  async republishListing(id: string, adminId?: string, adminRole?: string) {
    await this.assertListingAccess(id, adminId, adminRole);
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!listing) throw new NotFoundException("Listing not found");
    if (!["approved", "published", "publishing"].includes(listing.status)) {
      throw new BadRequestException("Listing is not ready for publication");
    }
    await this.publishQueue.add("publish", { listingId: id });
    void this.userMessaging.notifyListingModeration(
      { userId: listing.userId, title: listing.title },
      "republish",
    );
    return { data: { queued: true, listingId: id } };
  }

  async rejectListing(id: string, dto: ModerationNoteDto, adminId?: string, adminRole?: string) {
    await this.assertListingAccess(id, adminId, adminRole);
    const moderatorId = await this.moderatorId(adminId);
    await this.db.insert(moderationLogs).values({
      listingId: id,
      moderatorId,
      action: "reject",
      note: dto.note,
    });

    const [row] = await this.db
      .update(listings)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    if (!row) throw new NotFoundException("Listing not found");
    void this.userMessaging.notifyListingModeration(
      { userId: row.userId, title: row.title },
      "reject",
      dto.note,
    );
    return { data: row };
  }

  async cancelListing(id: string, dto: ModerationNoteDto, adminId?: string, adminRole?: string) {
    await this.assertListingAccess(id, adminId, adminRole);
    const moderatorId = await this.moderatorId(adminId);
    await this.db.insert(moderationLogs).values({
      listingId: id,
      moderatorId,
      action: "reject",
      note: dto.note ?? "Скасовано адміністратором",
    });

    const [row] = await this.db
      .update(listings)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    if (!row) throw new NotFoundException("Listing not found");
    void this.userMessaging.notifyListingModeration(
      { userId: row.userId, title: row.title },
      "cancel",
      dto.note ?? "Скасовано адміністратором",
    );
    return { data: row };
  }

  async updateListing(id: string, dto: AdminListingUpdateDto, adminId?: string, adminRole?: string) {
    await this.assertListingAccess(id, adminId, adminRole);
    const [existing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Listing not found");

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.price !== undefined) patch.price = dto.price;
    if (dto.contactPhone !== undefined) patch.contactPhone = dto.contactPhone;
    if (dto.status !== undefined) patch.status = dto.status;

    const [row] = await this.db
      .update(listings)
      .set(patch as typeof listings.$inferInsert)
      .where(eq(listings.id, id))
      .returning();
    if (!row) throw new NotFoundException("Listing not found");

    if (
      dto.status === "pending_moderation" &&
      existing.status === "pending_payment"
    ) {
      void this.userMessaging.notifyListingModeration(
        { userId: row.userId, title: row.title },
        "payment_confirmed",
      );
    }

    return { data: row };
  }

  async listUsers() {
    const allUsers = await this.db.select().from(users).orderBy(desc(users.createdAt));

    const [listingCounts, publishedCounts, spentTotals] = await Promise.all([
      this.db
        .select({ userId: listings.userId, c: count() })
        .from(listings)
        .groupBy(listings.userId),
      this.db
        .select({ userId: listings.userId, c: count() })
        .from(listings)
        .where(eq(listings.status, "published"))
        .groupBy(listings.userId),
      this.db
        .select({ userId: payments.userId, total: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.status, "completed"))
        .groupBy(payments.userId),
    ]);

    const countMap = new Map(listingCounts.map((x) => [x.userId, x.c]));
    const publishedMap = new Map(publishedCounts.map((x) => [x.userId, x.c]));
    const spentMap = new Map(
      spentTotals.map((x) => [x.userId, Number(x.total ?? 0)]),
    );

    return {
      data: allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        channel: detectChannel(u),
        telegramId: u.telegramId,
        viberId: u.viberId,
        whatsappId: u.whatsappId,
        listingsCount: countMap.get(u.id) ?? 0,
        publishedCount: publishedMap.get(u.id) ?? 0,
        totalSpent: spentMap.get(u.id) ?? 0,
        createdAt: u.createdAt,
      })),
    };
  }

  async getUserDetail(id: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) throw new NotFoundException("User not found");

    const [userListings, userPayments, userBoosts, pubRows] = await Promise.all([
      this.db
        .select({
          id: listings.id,
          title: listings.title,
          status: listings.status,
          price: listings.price,
          currency: listings.currency,
          sourceChannel: listings.sourceChannel,
          isPinned: listings.isPinned,
          boostScore: listings.boostScore,
          publishedAt: listings.publishedAt,
          createdAt: listings.createdAt,
          projectName: projects.name,
          projectSlug: projects.slug,
          categoryName: categories.name,
          cityName: cities.name,
        })
        .from(listings)
        .innerJoin(projects, eq(listings.projectId, projects.id))
        .innerJoin(categories, eq(listings.categoryId, categories.id))
        .leftJoin(cities, eq(listings.cityId, cities.id))
        .where(eq(listings.userId, id))
        .orderBy(desc(listings.createdAt)),
      this.db
        .select({
          id: payments.id,
          listingId: payments.listingId,
          amount: payments.amount,
          currency: payments.currency,
          method: payments.method,
          status: payments.status,
          reference: payments.reference,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          listingTitle: listings.title,
        })
        .from(payments)
        .leftJoin(listings, eq(payments.listingId, listings.id))
        .where(eq(payments.userId, id))
        .orderBy(desc(payments.createdAt)),
      this.db
        .select({
          id: listingBoosts.id,
          type: listingBoosts.type,
          price: listingBoosts.price,
          currency: listingBoosts.currency,
          startsAt: listingBoosts.startsAt,
          endsAt: listingBoosts.endsAt,
          listingId: listings.id,
          listingTitle: listings.title,
        })
        .from(listingBoosts)
        .innerJoin(listings, eq(listingBoosts.listingId, listings.id))
        .where(eq(listings.userId, id))
        .orderBy(desc(listingBoosts.createdAt)),
      this.db
        .select({ c: count() })
        .from(channelPublications)
        .innerJoin(listings, eq(channelPublications.listingId, listings.id))
        .where(
          and(
            eq(listings.userId, id),
            eq(channelPublications.status, "published"),
          ),
        ),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const l of userListings) {
      statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
    }

    const totalSpent = userPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        channel: detectChannel(user),
        telegramId: user.telegramId,
        viberId: user.viberId,
        whatsappId: user.whatsappId,
        locale: user.locale,
        phoneVerifiedAt: user.phoneVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        stats: {
          listingsTotal: userListings.length,
          listingsPublished: statusCounts.published ?? 0,
          listingsPending:
            (statusCounts.pending_moderation ?? 0) +
            (statusCounts.pending_payment ?? 0),
          listingsDraft: statusCounts.draft ?? 0,
          listingsRejected: statusCounts.rejected ?? 0,
          totalSpent,
          paymentsCount: userPayments.length,
          boostsCount: userBoosts.length,
          publicationsCount: pubRows[0]?.c ?? 0,
        },
        listings: userListings,
        payments: userPayments,
        boosts: userBoosts,
      },
    };
  }

  async createUser(dto: AdminUserCreateDto) {
    const [row] = await this.db
      .insert(users)
      .values({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        telegramId: dto.telegramId,
        viberId: dto.viberId,
        whatsappId: dto.whatsappId,
      })
      .returning();
    return { data: row };
  }

  async updateUser(id: string, dto: AdminUserUpdateDto) {
    const [row] = await this.db
      .update(users)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!row) throw new NotFoundException("User not found");
    return { data: row };
  }

  async listProjects() {
    const data = await this.db.select().from(projects).orderBy(projects.name);
    return { data };
  }

  async createProject(dto: ProjectCreateDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    const [existing] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    if (existing) {
      throw new BadRequestException("Проєкт з таким slug вже існує");
    }

    const [row] = await this.db
      .insert(projects)
      .values({
        slug,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      })
      .returning();
    if (!row) throw new BadRequestException("Не вдалося створити проєкт");

    await this.db.insert(categories).values([
      { projectId: row.id, slug: "general", name: "Загальне", sortOrder: 1 },
      { projectId: row.id, slug: "premium", name: "Преміум", sortOrder: 2 },
    ]);

    await this.seedVacancyPricing(row.id);
    await this.seedProjectAddons(row.id);

    return { data: row };
  }

  private defaultAddonTiers() {
    return [
      {
        slug: "pin",
        name: "Закріплення",
        description: "Закріпити оголошення в шапці каналу на тиждень",
        price: Number(process.env.HORECA_PIN_PRICE ?? 500),
        billingUnit: "fixed" as const,
        sortOrder: 1,
      },
      {
        slug: "daily_duplicate",
        name: "Щоденне дублювання",
        description: "Дублювати оголошення щодня протягом тижня",
        price: Number(process.env.HORECA_DAILY_DUPLICATE_PRICE ?? 150),
        billingUnit: "per_vacancy" as const,
        sortOrder: 2,
      },
      {
        slug: "featured",
        name: "В топ",
        description: "Підняти оголошення в рекомендовані",
        price: 149,
        billingUnit: "fixed" as const,
        sortOrder: 3,
      },
      {
        slug: "republish",
        name: "Повторна публікація",
        description: "Опублікувати оголошення знову",
        price: 0,
        billingUnit: "fixed" as const,
        sortOrder: 4,
      },
    ];
  }

  private async seedProjectAddons(projectId: string) {
    for (const addon of this.defaultAddonTiers()) {
      await this.db
        .insert(projectAddons)
        .values({
          projectId,
          slug: addon.slug,
          name: addon.name,
          description: addon.description,
          price: addon.price,
          billingUnit: addon.billingUnit,
          sortOrder: addon.sortOrder,
        })
        .onConflictDoNothing();
    }
  }

  async initProjectAddons(projectId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!project) throw new NotFoundException("Project not found");
    await this.seedProjectAddons(projectId);
    return this.listProjectAddons(projectId);
  }

  async listProjectAddons(projectId?: string) {
    const q = this.db
      .select({
        id: projectAddons.id,
        projectId: projectAddons.projectId,
        slug: projectAddons.slug,
        name: projectAddons.name,
        description: projectAddons.description,
        price: projectAddons.price,
        billingUnit: projectAddons.billingUnit,
        sortOrder: projectAddons.sortOrder,
        isActive: projectAddons.isActive,
        projectName: projects.name,
      })
      .from(projectAddons)
      .innerJoin(projects, eq(projectAddons.projectId, projects.id))
      .orderBy(projects.name, projectAddons.sortOrder);
    const data = projectId
      ? await q.where(eq(projectAddons.projectId, projectId))
      : await q;
    return { data };
  }

  async updateProjectAddon(
    id: string,
    dto: {
      name?: string;
      description?: string;
      price?: number;
      billingUnit?: "fixed" | "per_vacancy";
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const [row] = await this.db
      .update(projectAddons)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(projectAddons.id, id))
      .returning();
    if (!row) throw new NotFoundException("Addon not found");
    return { data: row };
  }

  private async seedVacancyPricing(projectId: string) {
    const tiers = [
      { vacancyCount: 1, name: "1 вакансія", price: 299 },
      { vacancyCount: 2, name: "2 вакансії", price: 499 },
      { vacancyCount: 3, name: "3 вакансії", price: 699 },
    ];
    for (const t of tiers) {
      await this.db
        .insert(vacancyTypes)
        .values({
          projectId,
          slug: `vacancy-${t.vacancyCount}`,
          name: t.name,
          vacancyCount: t.vacancyCount,
          price: t.price,
          sortOrder: t.vacancyCount,
        })
        .onConflictDoNothing();
    }
  }

  async initVacancyPricing(projectId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!project) throw new NotFoundException("Project not found");
    await this.seedVacancyPricing(projectId);
    await this.seedProjectAddons(projectId);
    return this.listVacancyTypes(projectId);
  }

  async updateProjectPricing(id: string, dto: ProjectPricingDto) {
    const [existing] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Project not found");

    if (dto.slug && dto.slug !== existing.slug) {
      const [dup] = await this.db
        .select()
        .from(projects)
        .where(eq(projects.slug, dto.slug))
        .limit(1);
      if (dup) throw new BadRequestException("Проєкт з таким slug вже існує");
    }

    const [row] = await this.db
      .update(projects)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return { data: row };
  }

  async deleteProject(id: string) {
    const [existing] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Project not found");

    const [used] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.projectId, id));
    if ((used?.c ?? 0) > 0) {
      throw new BadRequestException("Неможливо видалити — є оголошення в цьому проєкті");
    }

    await this.db.delete(projects).where(eq(projects.id, id));
    return { ok: true };
  }

  async listChannels() {
    const rows = await this.db
      .select({ channel: channelConfigs, project: projects })
      .from(channelConfigs)
      .innerJoin(projects, eq(channelConfigs.projectId, projects.id))
      .where(eq(channelConfigs.purpose, "publication"))
      .orderBy(desc(channelConfigs.createdAt));

    const cityRows = await this.db
      .select({
        channelConfigId: projectChannelCities.channelConfigId,
        cityId: cities.id,
        cityName: cities.name,
        citySlug: cities.slug,
      })
      .from(projectChannelCities)
      .innerJoin(cities, eq(projectChannelCities.cityId, cities.id));

    const citiesByChannel = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const c of cityRows) {
      const list = citiesByChannel.get(c.channelConfigId) ?? [];
      list.push({ id: c.cityId, name: c.cityName, slug: c.citySlug });
      citiesByChannel.set(c.channelConfigId, list);
    }

    const channelIds = rows.map((r) => r.channel.id);
    const { byChannel, summary } = await this.buildChannelStats(channelIds);
    summary.activeChannels = rows.filter((r) => r.channel.isActive).length;

    return {
      summary,
      data: rows.map((r) => {
        const channelCities = citiesByChannel.get(r.channel.id) ?? [];
        const stats = byChannel.get(r.channel.id);
        return {
          id: r.channel.id,
          projectId: r.channel.projectId,
          type: r.channel.channel,
          purpose: r.channel.purpose,
          name: r.channel.name,
          project: r.project.name,
          isActive: r.channel.isActive,
          isGlobal: channelCities.length === 0,
          cities: channelCities,
          config: this.enrichChannelConfig(
            r.channel.channel,
            (r.channel.config as Record<string, unknown>) ?? {},
          ),
          stats: stats ?? this.emptyChannelStats(),
        };
      }),
    };
  }

  private emptyChannelStats() {
    return {
      publicationsTotal: 0,
      publicationsPublished: 0,
      publicationsToday: 0,
      publicationsMonth: 0,
      revenueTotal: 0,
      revenueToday: 0,
      revenueMonth: 0,
      daily: [] as { date: string; publications: number; revenue: number }[],
    };
  }

  private async buildChannelStats(channelIds: string[]) {
    const empty = this.emptyChannelStats();
    const summary = {
      totalChannels: channelIds.length,
      activeChannels: 0,
      publicationsToday: 0,
      publicationsMonth: 0,
      revenueToday: 0,
      revenueMonth: 0,
      revenueTotal: 0,
    };

    if (!channelIds.length) {
      return { byChannel: new Map<string, ReturnType<typeof this.emptyChannelStats>>(), summary };
    }

    type ChannelStat = ReturnType<typeof this.emptyChannelStats> & {
      dailyMap: Map<string, { publications: number; revenue: number }>;
    };

    const byChannel = new Map<string, ChannelStat>();
    for (const id of channelIds) {
      byChannel.set(id, { ...empty, daily: [], dailyMap: new Map() });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(now);
    trendStart.setDate(trendStart.getDate() - 13);
    trendStart.setHours(0, 0, 0, 0);

    const pubRows = await this.db
      .select({
        channelConfigId: channelPublications.channelConfigId,
        status: channelPublications.status,
        publishedAt: channelPublications.publishedAt,
        createdAt: channelPublications.createdAt,
      })
      .from(channelPublications)
      .where(inArray(channelPublications.channelConfigId, channelIds));

    const paidRows = await this.db
      .select({
        listingId: payments.listingId,
        amount: payments.amount,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(and(eq(payments.status, "completed"), isNotNull(payments.listingId)));

    const listingPubRows = await this.db
      .select({
        listingId: channelPublications.listingId,
        channelConfigId: channelPublications.channelConfigId,
      })
      .from(channelPublications)
      .where(eq(channelPublications.status, "published"));

    const channelsByListing = new Map<string, string[]>();
    for (const row of listingPubRows) {
      const list = channelsByListing.get(row.listingId) ?? [];
      list.push(row.channelConfigId);
      channelsByListing.set(row.listingId, list);
    }

    const bumpDaily = (
      st: ChannelStat,
      date: Date,
      field: "publications" | "revenue",
      value: number,
    ) => {
      if (date < trendStart) return;
      const key = date.toISOString().slice(0, 10);
      const row = st.dailyMap.get(key) ?? { publications: 0, revenue: 0 };
      row[field] += value;
      st.dailyMap.set(key, row);
    };

    for (const pub of pubRows) {
      const st = byChannel.get(pub.channelConfigId);
      if (!st) continue;
      st.publicationsTotal++;
      if (pub.status === "published") st.publicationsPublished++;
      const pubDate = pub.publishedAt ?? pub.createdAt;
      if (pubDate >= todayStart) {
        st.publicationsToday++;
        summary.publicationsToday++;
      }
      if (pubDate >= monthStart) {
        st.publicationsMonth++;
        summary.publicationsMonth++;
      }
      if (pub.status === "published") {
        bumpDaily(st, pubDate, "publications", 1);
      }
    }

    for (const pay of paidRows) {
      if (!pay.listingId) continue;
      const chList = channelsByListing.get(pay.listingId);
      if (!chList?.length) continue;
      const share = Number(pay.amount) / chList.length;
      const payDate = pay.paidAt ?? pay.createdAt;
      for (const chId of chList) {
        const st = byChannel.get(chId);
        if (!st) continue;
        st.revenueTotal += share;
        summary.revenueTotal += share;
        if (payDate >= todayStart) {
          st.revenueToday += share;
          summary.revenueToday += share;
        }
        if (payDate >= monthStart) {
          st.revenueMonth += share;
          summary.revenueMonth += share;
        }
        bumpDaily(st, payDate, "revenue", share);
      }
    }

    for (const [, st] of byChannel) {
      st.daily = [...st.dailyMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, row]) => ({
          date,
          publications: row.publications,
          revenue: Math.round(row.revenue),
        }));
      delete (st as { dailyMap?: Map<string, { publications: number; revenue: number }> }).dailyMap;
      for (const key of ["revenueTotal", "revenueToday", "revenueMonth"] as const) {
        st[key] = Math.round(st[key]);
      }
    }

    summary.revenueTotal = Math.round(summary.revenueTotal);
    summary.revenueToday = Math.round(summary.revenueToday);
    summary.revenueMonth = Math.round(summary.revenueMonth);

    return { byChannel, summary };
  }

  async listRegions() {
    const data = await this.db
      .select()
      .from(regions)
      .orderBy(regions.sortOrder);
    return { data };
  }

  async createRegion(dto: RegionCreateDto) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    if (!slug) throw new BadRequestException("Invalid slug");

    const [row] = await this.db
      .insert(regions)
      .values({
        name: dto.name.trim(),
        slug,
        sortOrder: dto.sortOrder ?? 0,
      })
      .returning();
    return { data: row };
  }

  async updateRegion(id: string, dto: RegionUpdateDto) {
    const [existing] = await this.db
      .select()
      .from(regions)
      .where(eq(regions.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Region not found");

    const name = dto.name?.trim() ?? existing.name;
    const slug =
      dto.slug?.trim() ||
      (dto.name ? slugify(dto.name) : existing.slug);

    const [row] = await this.db
      .update(regions)
      .set({
        name,
        slug,
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      })
      .where(eq(regions.id, id))
      .returning();
    return { data: row };
  }

  async deleteRegion(id: string) {
    const [existing] = await this.db
      .select()
      .from(regions)
      .where(eq(regions.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Region not found");

    const [used] = await this.db
      .select({ c: count() })
      .from(cities)
      .where(eq(cities.regionId, id));
    if ((used?.c ?? 0) > 0) {
      throw new BadRequestException("Спочатку видаліть міста області");
    }

    await this.db.delete(regions).where(eq(regions.id, id));
    return { ok: true };
  }

  async listCities() {
    const data = await this.db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
        regionId: cities.regionId,
        sortOrder: cities.sortOrder,
        isActive: cities.isActive,
      })
      .from(cities)
      .orderBy(asc(cities.sortOrder), asc(cities.name));
    return { data };
  }

  private async ensureDefaultRegion(): Promise<string> {
    const [first] = await this.db
      .select({ id: regions.id })
      .from(regions)
      .orderBy(asc(regions.sortOrder))
      .limit(1);
    if (first) return first.id;

    const [created] = await this.db
      .insert(regions)
      .values({
        name: "Україна",
        slug: "ukraine",
        sortOrder: 0,
      })
      .returning({ id: regions.id });
    if (!created) throw new BadRequestException("Failed to create default region");
    return created.id;
  }

  async createCity(dto: CityCreateDto) {
    const regionId = dto.regionId?.trim() || (await this.ensureDefaultRegion());
    const slug = dto.slug?.trim() || slugify(dto.name);
    if (!slug) throw new BadRequestException("Invalid slug");

    const [row] = await this.db
      .insert(cities)
      .values({
        regionId,
        name: dto.name.trim(),
        slug,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return { data: row };
  }

  async updateCity(id: string, dto: CityUpdateDto) {
    const [existing] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("City not found");

    const name = dto.name?.trim() ?? existing.name;
    const slug =
      dto.slug?.trim() ||
      (dto.name ? slugify(dto.name) : existing.slug);

    const [row] = await this.db
      .update(cities)
      .set({
        name,
        slug,
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      })
      .where(eq(cities.id, id))
      .returning();
    return { data: row };
  }

  async deleteCity(id: string) {
    const [existing] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("City not found");

    const [used] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.cityId, id));
    if ((used?.c ?? 0) > 0) {
      throw new BadRequestException("Місто використовується в оголошеннях");
    }

    await this.db.delete(cities).where(eq(cities.id, id));
    return { ok: true };
  }

  private async syncChannelCities(
    projectId: string,
    channelConfigId: string,
    isGlobal: boolean,
    cityIds?: string[],
  ) {
    await this.db
      .delete(projectChannelCities)
      .where(eq(projectChannelCities.channelConfigId, channelConfigId));

    if (!isGlobal && cityIds?.length) {
      await this.db.insert(projectChannelCities).values(
        cityIds.map((cityId) => ({
          projectId,
          channelConfigId,
          cityId,
        })),
      );
    }
  }

  async listPayments() {
    const data = await this.db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(100);
    return { data };
  }

  async analytics() {
    const [views] = await this.db
      .select({ c: count() })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "view"));

    const [clicks] = await this.db
      .select({ c: count() })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "click"));

    const [conversions] = await this.db
      .select({ c: count() })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, "conversion"));

    const [paymentStats] = await this.db
      .select({ c: count(), revenue: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.status, "completed"));

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const recentEvents = await this.db
      .select({
        eventType: analyticsEvents.eventType,
        createdAt: analyticsEvents.createdAt,
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since));

    const dailyMap = new Map<
      string,
      { date: string; views: number; clicks: number; conversions: number }
    >();

    for (const event of recentEvents) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const row = dailyMap.get(date) ?? {
        date,
        views: 0,
        clicks: 0,
        conversions: 0,
      };
      if (event.eventType === "view") row.views++;
      else if (event.eventType === "click") row.clicks++;
      else if (event.eventType === "conversion") row.conversions++;
      dailyMap.set(date, row);
    }

    const daily = [...dailyMap.values()].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    return {
      views: Number(views?.c ?? 0),
      clicks: Number(clicks?.c ?? 0),
      conversions: Number(conversions?.c ?? 0),
      payments: Number(paymentStats?.c ?? 0),
      revenue: Number(paymentStats?.revenue ?? 0),
      daily,
    };
  }

  async listPricing() {
    return this.listVacancyTypes();
  }

  async updatePricing(id: string, dto: PricingUpdateDto) {
    return this.updateVacancyType(id, {
      name: dto.name,
      price: dto.priceMonthly,
      isActive: dto.isActive,
    });
  }

  async listVacancyTypes(projectId?: string) {
    const q = this.db
      .select({
        id: vacancyTypes.id,
        projectId: vacancyTypes.projectId,
        slug: vacancyTypes.slug,
        name: vacancyTypes.name,
        vacancyCount: vacancyTypes.vacancyCount,
        price: vacancyTypes.price,
        sortOrder: vacancyTypes.sortOrder,
        isActive: vacancyTypes.isActive,
        projectName: projects.name,
      })
      .from(vacancyTypes)
      .innerJoin(projects, eq(vacancyTypes.projectId, projects.id))
      .orderBy(projects.name, vacancyTypes.vacancyCount);
    const data = projectId
      ? await q.where(eq(vacancyTypes.projectId, projectId))
      : await q;
    return { data };
  }

  async updateVacancyType(
    id: string,
    dto: { name?: string; price?: number; sortOrder?: number; isActive?: boolean },
  ) {
    const [row] = await this.db
      .update(vacancyTypes)
      .set(dto)
      .where(eq(vacancyTypes.id, id))
      .returning();
    if (!row) throw new NotFoundException("Vacancy type not found");
    return { data: row };
  }

  async listManagers(period?: "7d" | "30d" | "all") {
    const managers = await this.db
      .select()
      .from(adminManagers)
      .orderBy(desc(adminManagers.createdAt));

    const assignments = await this.db
      .select({
        managerId: adminManagerProjects.managerId,
        projectId: adminManagerProjects.projectId,
        projectName: projects.name,
      })
      .from(adminManagerProjects)
      .innerJoin(projects, eq(adminManagerProjects.projectId, projects.id));

    const projectMap = new Map<string, { id: string; name: string }[]>();
    for (const a of assignments) {
      const list = projectMap.get(a.managerId) ?? [];
      list.push({ id: a.projectId, name: a.projectName });
      projectMap.set(a.managerId, list);
    }

    let since: Date | null = null;
    if (period === "7d") since = new Date(Date.now() - 7 * 86_400_000);
    else if (period === "30d") since = new Date(Date.now() - 30 * 86_400_000);

    const moderationRows = await this.db
      .select({
        managerId: adminManagers.id,
        action: moderationLogs.action,
        c: count(),
        lastAt: sql<Date | null>`max(${moderationLogs.createdAt})`,
      })
      .from(moderationLogs)
      .innerJoin(users, eq(moderationLogs.moderatorId, users.id))
      .innerJoin(
        adminManagers,
        sql`lower(${adminManagers.email}) = lower(${users.email})`,
      )
      .where(since ? gte(moderationLogs.createdAt, since) : undefined)
      .groupBy(adminManagers.id, moderationLogs.action);

    const removalConditions = [isNotNull(channelPublications.removedByAdminId)];
    if (since) removalConditions.push(gte(channelPublications.removedAt, since));

    const removalRows = await this.db
      .select({
        managerId: channelPublications.removedByAdminId,
        c: count(),
        lastAt: sql<Date | null>`max(${channelPublications.removedAt})`,
      })
      .from(channelPublications)
      .where(and(...removalConditions))
      .groupBy(channelPublications.removedByAdminId);

    type ManagerStats = {
      approved: number;
      rejected: number;
      removed: number;
      lastActivity: string | null;
    };

    const statsMap = new Map<string, ManagerStats>();
    for (const m of managers) {
      statsMap.set(m.id, {
        approved: 0,
        rejected: 0,
        removed: 0,
        lastActivity: null,
      });
    }

    const touchLast = (id: string, at: Date | null) => {
      if (!at) return;
      const s = statsMap.get(id);
      if (!s) return;
      const iso = at.toISOString();
      if (!s.lastActivity || iso > s.lastActivity) s.lastActivity = iso;
    };

    for (const row of moderationRows) {
      const s = statsMap.get(row.managerId);
      if (!s) continue;
      const n = Number(row.c);
      if (row.action === "approve") s.approved = n;
      else if (row.action === "reject") s.rejected = n;
      touchLast(row.managerId, row.lastAt);
    }

    for (const row of removalRows) {
      if (!row.managerId) continue;
      const s = statsMap.get(row.managerId);
      if (!s) continue;
      s.removed = Number(row.c);
      touchLast(row.managerId, row.lastAt);
    }

    const data = managers.map((m) => {
      const s = statsMap.get(m.id) ?? {
        approved: 0,
        rejected: 0,
        removed: 0,
        lastActivity: null,
      };
      const totalModerated = s.approved + s.rejected;
      return {
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
        isActive: m.isActive,
        projects: projectMap.get(m.id) ?? [],
        createdAt: m.createdAt,
        stats: {
          approved: s.approved,
          rejected: s.rejected,
          totalModerated,
          removedPublications: s.removed,
          approvalRate:
            totalModerated > 0
              ? Math.round((s.approved / totalModerated) * 100)
              : null,
          lastActivity: s.lastActivity,
        },
      };
    });

    const moderatedTotal = data.reduce((sum, m) => sum + m.stats.totalModerated, 0);
    const rates = data
      .map((m) => m.stats.approvalRate)
      .filter((r): r is number => r !== null);
    const avgApprovalRate =
      rates.length > 0
        ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
        : null;

    return {
      data,
      summary: {
        totalManagers: managers.length,
        activeManagers: managers.filter((m) => m.isActive).length,
        totalModerated: moderatedTotal,
        avgApprovalRate,
        period: period ?? "all",
      },
    };
  }

  async createManager(dto: AdminManagerCreateDto) {
    const hash = await hashPassword(dto.password);
    const [row] = await this.db
      .insert(adminManagers)
      .values({
        email: dto.email.toLowerCase(),
        passwordHash: hash,
        name: dto.name,
        role: dto.role ?? "manager",
      })
      .returning({
        id: adminManagers.id,
        email: adminManagers.email,
        name: adminManagers.name,
        role: adminManagers.role,
        isActive: adminManagers.isActive,
        createdAt: adminManagers.createdAt,
      });

    if (dto.projectIds?.length) {
      await this.db.insert(adminManagerProjects).values(
        dto.projectIds.map((projectId) => ({
          managerId: row!.id,
          projectId,
        })),
      );
    }

    return { data: row };
  }

  async updateManager(id: string, dto: AdminManagerUpdateDto) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.role !== undefined) patch.role = dto.role;
    if (dto.isActive !== undefined) patch.isActive = dto.isActive;
    if (dto.password) patch.passwordHash = await hashPassword(dto.password);

    const [row] = await this.db
      .update(adminManagers)
      .set(patch as typeof adminManagers.$inferInsert)
      .where(eq(adminManagers.id, id))
      .returning({
        id: adminManagers.id,
        email: adminManagers.email,
        name: adminManagers.name,
        role: adminManagers.role,
        isActive: adminManagers.isActive,
      });

    if (!row) throw new NotFoundException("Manager not found");

    if (dto.projectIds !== undefined) {
      await this.db
        .delete(adminManagerProjects)
        .where(eq(adminManagerProjects.managerId, id));
      if (dto.projectIds.length) {
        await this.db.insert(adminManagerProjects).values(
          dto.projectIds.map((projectId) => ({ managerId: id, projectId })),
        );
      }
    }

    return { data: row };
  }

  async deleteManager(id: string) {
    const [row] = await this.db
      .delete(adminManagers)
      .where(eq(adminManagers.id, id))
      .returning({ id: adminManagers.id });
    if (!row) throw new NotFoundException("Manager not found");
    return { ok: true };
  }

  webhookBaseUrl() {
    return process.env.PUBLIC_URL ?? process.env.API_URL ?? "http://localhost";
  }

  enrichChannelConfig(
    channel: string,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    const base = this.webhookBaseUrl();
    const urls: Record<string, string> = {
      telegram: `${base}/webhooks/telegram`,
      viber: `${base}/webhooks/viber`,
      whatsapp: `${base}/webhooks/whatsapp`,
    };
    if (urls[channel]) {
      const custom = config.webhookUrl;
      const useCustom =
        typeof custom === "string" &&
        custom.startsWith("https://") &&
        !/localhost|127\.0\.0\.1/i.test(custom);
      return { ...config, webhookUrl: useCustom ? custom : urls[channel] };
    }
    return config;
  }

  async createChannel(dto: ChannelCreateDto) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, dto.projectId))
      .limit(1);
    if (!project) throw new NotFoundException("Project not found");

    const purpose = dto.purpose ?? "publication";
    const isGlobal = dto.isGlobal ?? !dto.cityIds?.length;
    const config = this.enrichChannelConfig(dto.channel, dto.config ?? {});

    const [row] = await this.db
      .insert(channelConfigs)
      .values({
        projectId: dto.projectId,
        channel: dto.channel as (typeof channelConfigs.$inferInsert)["channel"],
        purpose: purpose as (typeof channelConfigs.$inferInsert)["purpose"],
        name: dto.name ?? null,
        config,
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.syncChannelCities(dto.projectId, row!.id, isGlobal, dto.cityIds);
    return { data: row };
  }

  async updateChannel(id: string, dto: ChannelUpdateDto) {
    const [existing] = await this.db
      .select()
      .from(channelConfigs)
      .where(eq(channelConfigs.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Channel not found");

    const config = dto.config
      ? this.enrichChannelConfig(existing.channel, {
          ...(existing.config as Record<string, unknown>),
          ...dto.config,
        })
      : undefined;

    const [row] = await this.db
      .update(channelConfigs)
      .set({
        ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
        ...(config ? { config } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(channelConfigs.id, id))
      .returning();

    if (dto.isGlobal !== undefined || dto.cityIds !== undefined) {
      const isGlobal = dto.isGlobal ?? dto.cityIds?.length === 0;
      await this.syncChannelCities(
        existing.projectId,
        id,
        isGlobal,
        dto.cityIds,
      );
    }

    return { data: row };
  }

  async listCategories(projectId?: string) {
    const query = this.db
      .select({
        id: categories.id,
        projectId: categories.projectId,
        slug: categories.slug,
        name: categories.name,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        projectName: projects.name,
      })
      .from(categories)
      .innerJoin(projects, eq(categories.projectId, projects.id))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    const data = projectId
      ? await query.where(eq(categories.projectId, projectId))
      : await query;

    return { data };
  }

  async createCategory(dto: CategoryCreateDto) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, dto.projectId))
      .limit(1);
    if (!project) throw new NotFoundException("Project not found");

    const slug = dto.slug?.trim() || slugify(dto.name);
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.projectId, dto.projectId), eq(categories.slug, slug)))
      .limit(1);
    if (existing) {
      throw new BadRequestException("Категорія з таким slug вже існує");
    }

    const [row] = await this.db
      .insert(categories)
      .values({
        projectId: dto.projectId,
        slug,
        name: dto.name.trim(),
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return { data: row };
  }

  async updateCategory(id: string, dto: CategoryUpdateDto) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Category not found");

    const name = dto.name?.trim() ?? existing.name;
    const slug =
      dto.slug?.trim() ||
      (dto.name ? slugify(dto.name) : existing.slug);

    if (slug !== existing.slug) {
      const [dup] = await this.db
        .select()
        .from(categories)
        .where(
          and(eq(categories.projectId, existing.projectId), eq(categories.slug, slug)),
        )
        .limit(1);
      if (dup) throw new BadRequestException("Категорія з таким slug вже існує");
    }

    const [row] = await this.db
      .update(categories)
      .set({
        name,
        slug,
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      })
      .where(eq(categories.id, id))
      .returning();
    return { data: row };
  }

  async deleteCategory(id: string) {
    const [existing] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException("Category not found");

    const [used] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.categoryId, id));
    if ((used?.c ?? 0) > 0) {
      throw new BadRequestException("Неможливо видалити — є оголошення в категорії");
    }

    await this.db.delete(categories).where(eq(categories.id, id));
    return { ok: true };
  }

  async deleteChannel(id: string) {
    const [row] = await this.db
      .delete(channelConfigs)
      .where(eq(channelConfigs.id, id))
      .returning({ id: channelConfigs.id });
    if (!row) throw new NotFoundException("Channel not found");
    return { ok: true };
  }

  async listPublications(status?: string) {
    const base = this.db
      .select({
        pub: channelPublications,
        listing: listings,
        channel: channelConfigs,
        project: projects,
        removedBy: adminManagers,
      })
      .from(channelPublications)
      .innerJoin(listings, eq(channelPublications.listingId, listings.id))
      .innerJoin(
        channelConfigs,
        eq(channelPublications.channelConfigId, channelConfigs.id),
      )
      .innerJoin(projects, eq(channelConfigs.projectId, projects.id))
      .leftJoin(
        adminManagers,
        eq(channelPublications.removedByAdminId, adminManagers.id),
      );

    const rows = status
      ? await base
          .where(
            eq(
              channelPublications.status,
              status as (typeof channelPublications.$inferSelect)["status"],
            ),
          )
          .orderBy(desc(channelPublications.createdAt))
          .limit(100)
      : await base
          .orderBy(desc(channelPublications.createdAt))
          .limit(100);

    const listingIds = [...new Set(rows.map((r) => r.listing.id))];
    const approverMap = await this.resolveApproverNames(listingIds);

    return {
      data: rows.map((r) => ({
        id: r.pub.id,
        status: r.pub.status,
        externalId: r.pub.externalId,
        errorMessage: r.pub.errorMessage,
        publishedAt: r.pub.publishedAt,
        removedAt: r.pub.removedAt,
        removedByName: r.removedBy?.name ?? null,
        createdAt: r.pub.createdAt,
        listingId: r.listing.id,
        listingTitle: r.listing.title,
        listingIsPinned: r.listing.isPinned,
        listingBoostScore: r.listing.boostScore,
        approvedByName: approverMap.get(r.listing.id) ?? null,
        channel: r.channel.channel,
        purpose: r.channel.purpose,
        project: r.project.name,
        projectId: r.project.id,
      })),
    };
  }

  private async resolveApproverNames(
    listingIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!listingIds.length) return map;

    const logs = await this.db
      .select({
        listingId: moderationLogs.listingId,
        userName: users.name,
        userEmail: users.email,
        createdAt: moderationLogs.createdAt,
      })
      .from(moderationLogs)
      .innerJoin(users, eq(moderationLogs.moderatorId, users.id))
      .where(
        and(
          inArray(moderationLogs.listingId, listingIds),
          eq(moderationLogs.action, "approve"),
        ),
      )
      .orderBy(desc(moderationLogs.createdAt));

    const managers = await this.db
      .select({ name: adminManagers.name, email: adminManagers.email })
      .from(adminManagers);
    const managerByEmail = new Map(
      managers.map((m) => [m.email.toLowerCase(), m.name]),
    );

    for (const log of logs) {
      if (map.has(log.listingId)) continue;
      const fromManager = log.userEmail
        ? managerByEmail.get(log.userEmail.toLowerCase())
        : undefined;
      map.set(log.listingId, fromManager ?? log.userName ?? "—");
    }
    return map;
  }

  async removePublication(id: string, adminId: string) {
    const [row] = await this.db
      .select({
        pub: channelPublications,
        channel: channelConfigs,
        project: projects,
      })
      .from(channelPublications)
      .innerJoin(
        channelConfigs,
        eq(channelPublications.channelConfigId, channelConfigs.id),
      )
      .innerJoin(projects, eq(channelConfigs.projectId, projects.id))
      .where(eq(channelPublications.id, id))
      .limit(1);

    if (!row) throw new NotFoundException("Publication not found");
    if (row.pub.status === "removed") {
      throw new BadRequestException("Publication already removed");
    }

    if (
      row.channel.channel === "telegram" &&
      row.pub.externalId &&
      row.pub.status === "published"
    ) {
      const parsed = parseTelegramExternalId(row.pub.externalId);
      if (parsed) {
        const token = await resolveTelegramBotToken(this.db, row.project.id);
        await deleteTelegramMessage(token, parsed.chatId, parsed.messageId);
      }
    }

    await this.db
      .update(channelPublications)
      .set({
        status: "removed",
        removedAt: new Date(),
        removedByAdminId: adminId,
        externalId: null,
      })
      .where(eq(channelPublications.id, id));

    const [admin] = await this.db
      .select({ name: adminManagers.name })
      .from(adminManagers)
      .where(eq(adminManagers.id, adminId))
      .limit(1);

    return { ok: true, removedByName: admin?.name ?? null };
  }

  async pinPublication(id: string) {
    const [row] = await this.db
      .select({
        pub: channelPublications,
        channel: channelConfigs,
        project: projects,
        listing: listings,
      })
      .from(channelPublications)
      .innerJoin(
        channelConfigs,
        eq(channelPublications.channelConfigId, channelConfigs.id),
      )
      .innerJoin(projects, eq(channelConfigs.projectId, projects.id))
      .innerJoin(listings, eq(channelPublications.listingId, listings.id))
      .where(eq(channelPublications.id, id))
      .limit(1);

    if (!row) throw new NotFoundException("Publication not found");
    if (row.pub.status !== "published") {
      throw new BadRequestException("Only published posts can be pinned");
    }
    if (row.channel.channel !== "telegram" || !row.pub.externalId) {
      throw new BadRequestException("Pin is only available for Telegram posts");
    }

    const parsed = parseTelegramExternalId(row.pub.externalId);
    if (!parsed) throw new BadRequestException("Invalid Telegram message reference");

    const token = await resolveTelegramBotToken(this.db, row.project.id);
    await pinTelegramMessage(token, parsed.chatId, parsed.messageId);

    await this.db
      .update(listings)
      .set({ isPinned: true, updatedAt: new Date() })
      .where(eq(listings.id, row.listing.id));

    return { ok: true };
  }

  async featurePublication(id: string) {
    const [row] = await this.db
      .select({
        pub: channelPublications,
        listing: listings,
      })
      .from(channelPublications)
      .innerJoin(listings, eq(channelPublications.listingId, listings.id))
      .where(eq(channelPublications.id, id))
      .limit(1);

    if (!row) throw new NotFoundException("Publication not found");
    if (row.pub.status === "removed") {
      throw new BadRequestException("Removed publication cannot be featured");
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(listingBoosts).values({
      listingId: row.listing.id,
      type: "featured",
      price: 0,
      startsAt: now,
      endsAt,
    });

    await this.db
      .update(listings)
      .set({
        boostScore: row.listing.boostScore + 100,
        updatedAt: now,
      })
      .where(eq(listings.id, row.listing.id));

    return { ok: true };
  }

  async republishPublication(id: string) {
    const [pub] = await this.db
      .select()
      .from(channelPublications)
      .where(eq(channelPublications.id, id))
      .limit(1);
    if (!pub) throw new NotFoundException("Publication not found");
    if (pub.status === "removed") {
      throw new BadRequestException("Removed publication cannot be republished");
    }

    await this.republishListing(pub.listingId);
    return { ok: true, listingId: pub.listingId };
  }

  async retryPublication(id: string) {
    const [pub] = await this.db
      .select()
      .from(channelPublications)
      .where(eq(channelPublications.id, id))
      .limit(1);
    if (!pub) throw new NotFoundException("Publication not found");

    await this.db
      .update(channelPublications)
      .set({ status: "pending", errorMessage: null })
      .where(eq(channelPublications.id, id));

    await this.publishQueue.add("publish", { listingId: pub.listingId });
    return { ok: true };
  }

  private async upsertTelegramChannel(
    projectId: string,
    purpose: "listing_input" | "publication",
    config: Record<string, unknown>,
    isActive: boolean,
  ) {
    const enriched = this.enrichChannelConfig("telegram", config);
    const [existing] = await this.db
      .select()
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.projectId, projectId),
          eq(channelConfigs.channel, "telegram"),
          eq(channelConfigs.purpose, purpose),
        ),
      )
      .limit(1);

    if (existing) {
      const [row] = await this.db
        .update(channelConfigs)
        .set({ config: enriched, isActive, updatedAt: new Date() })
        .where(eq(channelConfigs.id, existing.id))
        .returning();
      return row!;
    }

    const [row] = await this.db
      .insert(channelConfigs)
      .values({
        projectId,
        channel: "telegram",
        purpose,
        config: enriched,
        isActive,
      })
      .returning();
    return row!;
  }

  async getTelegramSettings(projectId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!project) throw new NotFoundException("Project not found");

    const rows = await this.db
      .select()
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.projectId, projectId),
          eq(channelConfigs.channel, "telegram"),
        ),
      );

    const input = rows.find((r) => r.purpose === "listing_input");
    const inputCfg = (input?.config ?? {}) as Record<string, unknown>;

    return {
      data: {
        projectId,
        projectName: project.name,
        botToken: String(inputCfg.botToken ?? ""),
        webhookUrl: String(
          inputCfg.webhookUrl ?? `${this.webhookBaseUrl()}/webhooks/telegram`,
        ),
        isActive: input?.isActive ?? false,
        botUsername: inputCfg.botUsername ? String(inputCfg.botUsername) : null,
        inputChannelId: input?.id ?? null,
      },
    };
  }

  async saveTelegramSettings(dto: TelegramSettingsDto) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, dto.projectId))
      .limit(1);
    if (!project) throw new NotFoundException("Project not found");

    const isActive = dto.isActive ?? true;
    let botUsername: string | null = null;

    if (dto.botToken) {
      const me = await this.telegramGetMe(dto.botToken);
      botUsername = me.username ? `@${me.username}` : null;
      const inputConfig: Record<string, unknown> = {
        botToken: dto.botToken,
        botUsername,
      };
      if (dto.webhookUrl) inputConfig.webhookUrl = dto.webhookUrl.trim();
      await this.upsertTelegramChannel(
        dto.projectId,
        "listing_input",
        inputConfig,
        isActive,
      );
    } else if (dto.webhookUrl) {
      const [existing] = await this.db
        .select()
        .from(channelConfigs)
        .where(
          and(
            eq(channelConfigs.projectId, dto.projectId),
            eq(channelConfigs.channel, "telegram"),
            eq(channelConfigs.purpose, "listing_input"),
          ),
        )
        .limit(1);
      if (existing) {
        const cfg = existing.config as Record<string, unknown>;
        await this.upsertTelegramChannel(
          dto.projectId,
          "listing_input",
          { ...cfg, webhookUrl: dto.webhookUrl.trim() },
          isActive,
        );
      }
    }

    return this.getTelegramSettings(dto.projectId);
  }

  async registerTelegramWebhook(projectId: string) {
    const settings = await this.getTelegramSettings(projectId);
    const token = settings.data.botToken;
    if (!token) throw new BadRequestException("Bot token required");

    const webhookUrl = settings.data.webhookUrl.trim();
    if (!webhookUrl.startsWith("https://")) {
      throw new BadRequestException(
        "Webhook HTTPS olmalı. Örnek: https://sizin-domain.com/webhooks/telegram veya ngrok URL",
      );
    }
    if (/localhost|127\.0\.0\.1/i.test(webhookUrl)) {
      throw new BadRequestException(
        "Telegram localhost kabul etmez. ngrok veya canlı domain kullanın.",
      );
    }

    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      },
    );
    const body = (await res.json()) as { ok: boolean; description?: string };
    if (!body.ok) {
      throw new BadRequestException(body.description ?? "Webhook failed");
    }
    return { ok: true, webhookUrl };
  }

  async telegramGetMe(token: string) {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const body = (await res.json()) as {
      ok: boolean;
      result?: { username?: string; first_name?: string };
      description?: string;
    };
    if (!body.ok) {
      throw new BadRequestException(body.description ?? "Invalid bot token");
    }
    return body.result ?? {};
  }

  async getActiveTelegramBotConfig() {
    const rows = await this.db
      .select()
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.channel, "telegram"),
          eq(channelConfigs.purpose, "listing_input"),
        ),
      );

    const row =
      rows.find((r) => r.isActive) ??
      rows.find((r) => {
        const cfg = r.config as Record<string, unknown>;
        return Boolean(cfg.botToken);
      });

    if (!row) return null;
    const cfg = row.config as Record<string, unknown>;
    const token = String(cfg.botToken ?? "");
    if (!token) return null;
    return {
      botToken: token,
      projectId: row.projectId,
      botUsername: cfg.botUsername ? String(cfg.botUsername) : null,
    };
  }
}
