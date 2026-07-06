import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  categories,
  channelConfigs,
  cities,
  districts,
  listingMedia,
  listingPositions,
  listings,
  projects,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";

const PUBLIC_STATUSES = ["published", "approved"] as const;

@Injectable()
export class ListingsPublicService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async resolveBotToken(projectId: string): Promise<string | null> {
    const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (fromEnv) return fromEnv;

    const rows = await this.db
      .select()
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.projectId, projectId),
          eq(channelConfigs.channel, "telegram"),
          eq(channelConfigs.purpose, "listing_input"),
        ),
      );

    const row =
      rows.find((r) => r.isActive) ??
      rows.find((r) => Boolean((r.config as Record<string, unknown>).botToken));

    const token = row
      ? String((row.config as Record<string, unknown>).botToken ?? "")
      : "";
    return token || null;
  }

  async resolveMediaUrl(
    raw: string | null | undefined,
    projectId: string,
  ): Promise<string | null> {
    if (!raw?.trim()) return null;
    const url = raw.trim();
    if (url.startsWith("http://") || url.startsWith("https://")) return url;

    if (url.startsWith("tg:")) {
      const token = await this.resolveBotToken(projectId);
      if (!token) return null;
      const fileId = url.slice(3);
      const fileRes = await fetch(
        `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      );
      const fileBody = (await fileRes.json()) as {
        ok: boolean;
        result?: { file_path?: string };
      };
      if (!fileBody.ok || !fileBody.result?.file_path) return null;
      return `https://api.telegram.org/file/bot${token}/${fileBody.result.file_path}`;
    }

    return url;
  }

  private async projectBySlug(slug: string) {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    return row ?? null;
  }

  async findCitiesByProjectSlug(projectSlug: string) {
    const project = await this.projectBySlug(projectSlug);
    if (!project) return null;

    return this.db
      .select({ slug: cities.slug, name: cities.name })
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.sortOrder));
  }

  async findPublicById(id: string) {
    const [row] = await this.db
      .select({
        listing: listings,
        project: projects,
        category: categories,
        city: cities,
        district: districts,
      })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .leftJoin(districts, eq(listings.districtId, districts.id))
      .where(
        and(
          eq(listings.id, id),
          inArray(listings.status, [...PUBLIC_STATUSES]),
        ),
      )
      .limit(1);

    if (!row) return null;

    const positions = await this.db
      .select()
      .from(listingPositions)
      .where(eq(listingPositions.listingId, id))
      .orderBy(asc(listingPositions.sortOrder));

    const media = await this.db
      .select()
      .from(listingMedia)
      .where(eq(listingMedia.listingId, id))
      .orderBy(asc(listingMedia.sortOrder));

    const imageUrl = media[0]?.url
      ? await this.resolveMediaUrl(media[0].url, row.listing.projectId)
      : null;

    return {
      id: row.listing.id,
      projectId: row.listing.projectId,
      title: row.listing.title,
      businessType: row.listing.businessType,
      address: row.listing.address,
      description: row.listing.description,
      contactPhone: row.listing.contactPhone,
      price: row.listing.price,
      currency: row.listing.currency,
      publishedAt: row.listing.publishedAt,
      projectSlug: row.project.slug,
      projectName: row.project.name,
      categoryName: row.category.name,
      city: row.city ? { name: row.city.name, slug: row.city.slug } : null,
      district: row.district ? { name: row.district.name } : null,
      imageUrl,
      media: await Promise.all(
        media.map(async (m) => ({
          url: (await this.resolveMediaUrl(m.url, row.listing.projectId)) ?? m.url,
          sortOrder: m.sortOrder,
        })),
      ),
      positions: positions.map((p) => ({
        title: p.title,
        salary: p.salary,
        workingHours: p.workingHours,
        description: p.description,
        sortOrder: p.sortOrder,
      })),
    };
  }

  async findPublishedByProject(projectSlug: string, citySlug?: string) {
    const project = await this.projectBySlug(projectSlug);
    if (!project) return [];

    let cityId: string | undefined;
    if (citySlug) {
      const [city] = await this.db
        .select()
        .from(cities)
        .where(eq(cities.slug, citySlug))
        .limit(1);
      if (!city) return [];
      cityId = city.id;
    }

    const rows = await this.db
      .select({
        listing: listings,
        city: cities,
      })
      .from(listings)
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .where(
        and(
          eq(listings.projectId, project.id),
          inArray(listings.status, [...PUBLIC_STATUSES]),
          cityId ? eq(listings.cityId, cityId) : undefined,
        ),
      )
      .orderBy(desc(listings.publishedAt), desc(listings.createdAt));

    if (!rows.length) return [];

    const listingIds = rows.map((r) => r.listing.id);
    const allPositions = await this.db
      .select()
      .from(listingPositions)
      .where(inArray(listingPositions.listingId, listingIds))
      .orderBy(asc(listingPositions.sortOrder));

    const allMedia = await this.db
      .select()
      .from(listingMedia)
      .where(inArray(listingMedia.listingId, listingIds))
      .orderBy(asc(listingMedia.sortOrder));

    const positionsByListing = new Map<string, typeof allPositions>();
    for (const p of allPositions) {
      const list = positionsByListing.get(p.listingId) ?? [];
      list.push(p);
      positionsByListing.set(p.listingId, list);
    }

    const mediaByListing = new Map<string, (typeof allMedia)[0]>();
    for (const m of allMedia) {
      if (!mediaByListing.has(m.listingId)) {
        mediaByListing.set(m.listingId, m);
      }
    }

    return Promise.all(
      rows.map(async ({ listing, city }) => {
        const positions = positionsByListing.get(listing.id) ?? [];
        const cover = mediaByListing.get(listing.id);
        const imageUrl = cover?.url
          ? await this.resolveMediaUrl(cover.url, project.id)
          : null;

        return {
          id: listing.id,
          title: listing.title,
          businessType: listing.businessType,
          address: listing.address,
          contactPhone: listing.contactPhone,
          citySlug: city?.slug ?? null,
          cityName: city?.name ?? null,
          imageUrl,
          vacancyCount: positions.length,
          firstVacancyTitle: positions[0]?.title ?? null,
          publishedAt: listing.publishedAt,
        };
      }),
    );
  }
}
