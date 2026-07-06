import { HORECA_SOURCE_PRODUCT, HORECA_SOURCE_VACANCY } from "@ilanhub/shared";
import { desc, eq } from "drizzle-orm";
import { categories, listings, projects, users, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import { BotsService } from "../bots/bots.service.js";
import { ListingsService } from "../listings/listings.service.js";
import type { CreateWebHorecaListingDto } from "./dto/web-horeca-listing.dto.js";
import { saveWebListingPhoto } from "./web-upload.util.js";

@Injectable()
export class AccountService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly botsService: BotsService,
    private readonly listingsService: ListingsService,
  ) {}

  async dashboard(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new NotFoundException("User not found");

    const rows = await this.db
      .select({ listing: listings })
      .from(listings)
      .where(eq(listings.userId, userId));

    const stats = {
      total: rows.length,
      published: rows.filter((r) => r.listing.status === "published").length,
      pending: rows.filter((r) =>
        ["pending_moderation", "pending_payment", "approved", "publishing"].includes(
          r.listing.status,
        ),
      ).length,
      draft: rows.filter((r) => r.listing.status === "draft").length,
    };

    const recent = await this.db
      .select({ listing: listings, project: projects })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .where(eq(listings.userId, userId))
      .orderBy(desc(listings.createdAt))
      .limit(5);

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        telegramId: user.telegramId,
        phoneVerified: !!user.phoneVerifiedAt,
      },
      stats,
      recent: recent.map((r) => ({
        id: r.listing.id,
        title: r.listing.title,
        status: r.listing.status,
        price: r.listing.price,
        currency: r.listing.currency,
        project: r.project.name,
        createdAt: r.listing.createdAt,
      })),
    };
  }

  async listings(userId: string) {
    const rows = await this.db
      .select({ listing: listings, project: projects })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .where(eq(listings.userId, userId))
      .orderBy(desc(listings.createdAt));

    return {
      data: rows.map((r) => ({
        id: r.listing.id,
        title: r.listing.title,
        description: r.listing.description,
        status: r.listing.status,
        price: r.listing.price,
        currency: r.listing.currency,
        project: r.project.name,
        projectSlug: r.project.slug,
        createdAt: r.listing.createdAt,
        publishedAt: r.listing.publishedAt,
      })),
    };
  }

  vacancyTypes(projectId: string) {
    return this.botsService.getVacancyTypes(projectId);
  }

  projectAddons(projectId: string) {
    return this.botsService.getProjectAddons(projectId);
  }

  async resolveHorecaProductCategory(projectId: string) {
    const items = await this.db
      .select()
      .from(categories)
      .where(eq(categories.projectId, projectId));
    const active = items.filter((c) => c.isActive);
    if (!active.length) return null;
    const preferred = ["used-equipment", "equipment", "horeca", "restaurant"];
    for (const slug of preferred) {
      const found = active.find((c) => c.slug === slug);
      if (found) return found;
    }
    return active[0]!;
  }

  async resolveHorecaCategory(projectId: string) {
    const items = await this.db
      .select()
      .from(categories)
      .where(eq(categories.projectId, projectId));
    const active = items.filter((c) => c.isActive);
    if (!active.length) return null;
    const preferred = ["horeca", "general", "restaurant"];
    for (const slug of preferred) {
      const found = active.find((c) => c.slug === slug);
      if (found) return found;
    }
    return active[0]!;
  }

  async resolveJobsCategory(projectId: string) {
    const items = await this.db
      .select()
      .from(categories)
      .where(eq(categories.projectId, projectId));
    const active = items.filter((c) => c.isActive);
    if (!active.length) return null;
    const preferred = ["office", "it", "general"];
    for (const slug of preferred) {
      const found = active.find((c) => c.slug === slug);
      if (found) return found;
    }
    return active[0]!;
  }

  async uploadPhoto(dataUrl: string) {
    const url = await saveWebListingPhoto(dataUrl);
    return { url };
  }

  async createHorecaListing(userId: string, dto: CreateWebHorecaListingDto) {
    const listingDesc = [
      dto.benefits,
      dto.pinPost ? "📌 Закріплення на тиждень" : "",
      dto.dailyDuplicate ? "🔁 Щоденне дублювання (7 днів)" : "",
      dto.scheduledPostAt ? `📅 Заплановано: ${dto.scheduledPostAt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const listing = await this.botsService.createListing({
      channel: "web",
      externalUserId: userId,
      projectId: dto.projectId,
      categoryId: dto.categoryId,
      cityId: dto.cityId,
      districtId: dto.districtId,
      businessType: dto.businessType,
      title: dto.title,
      address: dto.address,
      description: listingDesc || undefined,
      contactPhone: dto.contactPhone,
      listingPrice: dto.listingPrice,
      bundlePriceId: dto.bundlePriceId,
      mediaUrls: dto.mediaUrls,
      positions: dto.positions,
      sourceStep: dto.sourceStep ?? HORECA_SOURCE_VACANCY,
    });

    const submitted = await this.listingsService.submit(listing.id);
    return { data: submitted };
  }

  async createHorecaSellListing(userId: string, dto: CreateWebHorecaListingDto) {
    const listingDesc = [
      dto.pinPost ? "📌 Закріплення на тиждень" : "",
      dto.dailyDuplicate ? "🔁 Щоденне дублювання (7 днів)" : "",
      dto.scheduledPostAt ? `📅 Заплановано: ${dto.scheduledPostAt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const listing = await this.botsService.createListing({
      channel: "web",
      externalUserId: userId,
      projectId: dto.projectId,
      categoryId: dto.categoryId,
      cityId: dto.cityId,
      districtId: dto.districtId,
      businessType: dto.businessType,
      title: dto.title,
      address: dto.address,
      description: listingDesc || undefined,
      contactPhone: dto.contactPhone,
      listingPrice: dto.listingPrice,
      bundlePriceId: dto.bundlePriceId,
      mediaUrls: dto.mediaUrls,
      positions: dto.positions,
      sourceStep: HORECA_SOURCE_PRODUCT,
    });

    const submitted = await this.listingsService.submit(listing.id);
    return { data: submitted };
  }

  async createJobsListing(userId: string, dto: CreateWebHorecaListingDto) {
    return this.createHorecaListing(userId, dto);
  }
}
