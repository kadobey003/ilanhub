import { and, asc, eq, inArray } from "drizzle-orm";
import {
  categories,
  channelConfigs,
  channelPublications,
  cities,
  districts,
  listings,
  listingMedia,
  listingPositions,
  projectChannelCities,
  projects,
  type Database,
} from "@ilanhub/database";
import { createPublishers } from "./publishers/index.js";
import type { ListingPublishContext } from "./publishers/types.js";

export class PublishService {
  private readonly publishers: ReturnType<typeof createPublishers>;

  constructor(private readonly db: Database) {
    this.publishers = createPublishers(db);
  }

  private async buildContext(listingId: string): Promise<ListingPublishContext | null> {
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
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!row) return null;

    const positions = await this.db
      .select()
      .from(listingPositions)
      .where(eq(listingPositions.listingId, listingId))
      .orderBy(asc(listingPositions.sortOrder));

    const media = await this.db
      .select({ url: listingMedia.url, sortOrder: listingMedia.sortOrder })
      .from(listingMedia)
      .where(eq(listingMedia.listingId, listingId))
      .orderBy(asc(listingMedia.sortOrder));

    return {
      listing: row.listing,
      positions,
      media,
      project: { slug: row.project.slug, name: row.project.name },
      category: { name: row.category.name },
      city: row.city ? { name: row.city.name } : null,
      district: row.district ? { name: row.district.name } : null,
    };
  }

  async publishListing(listingId: string) {
    const ctx = await this.buildContext(listingId);
    if (!ctx) throw new Error(`Listing ${listingId} not found`);

    const { listing } = ctx;

    if (!["approved", "publishing", "published"].includes(listing.status)) {
      throw new Error(`Listing ${listingId} is not approved (status: ${listing.status})`);
    }

    await this.db
      .update(listings)
      .set({ status: "publishing", updatedAt: new Date() })
      .where(eq(listings.id, listingId));

    const allChannels = await this.db
      .select()
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.projectId, listing.projectId),
          eq(channelConfigs.purpose, "publication"),
          eq(channelConfigs.isActive, true),
        ),
      );

    const channelIds = allChannels.map((c) => c.id);
    const cityLinks =
      channelIds.length > 0
        ? await this.db
            .select()
            .from(projectChannelCities)
            .where(inArray(projectChannelCities.channelConfigId, channelIds))
        : [];

    const citiesByChannel = new Map<string, string[]>();
    for (const link of cityLinks) {
      const list = citiesByChannel.get(link.channelConfigId) ?? [];
      list.push(link.cityId);
      citiesByChannel.set(link.channelConfigId, list);
    }

    const channels = allChannels.filter((channel) => {
      const cityIds = citiesByChannel.get(channel.id);
      if (!cityIds?.length) return true;
      return listing.cityId ? cityIds.includes(listing.cityId) : false;
    });

    const results = await Promise.allSettled(
      channels.map(async (channel) => {
        const publisher = this.publishers[channel.channel];
        if (!publisher) {
          throw new Error(`No publisher for channel: ${channel.channel}`);
        }

        const [existing] = await this.db
          .select()
          .from(channelPublications)
          .where(
            and(
              eq(channelPublications.listingId, listingId),
              eq(channelPublications.channelConfigId, channel.id),
            ),
          )
          .limit(1);
        let publication = existing;

        if (!publication) {
          const [created] = await this.db
            .insert(channelPublications)
            .values({
              listingId,
              channelConfigId: channel.id,
              status: "pending",
            })
            .returning();
          publication = created;
        }

        try {
          const { externalId } = await publisher.publish(ctx, channel);
          await this.db
            .update(channelPublications)
            .set({
              status: "published",
              externalId,
              publishedAt: new Date(),
              errorMessage: null,
            })
            .where(eq(channelPublications.id, publication.id));
          return { channel: channel.channel, externalId, ok: true };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown publish error";
          await this.db
            .update(channelPublications)
            .set({
              status: "failed",
              errorMessage: message,
            })
            .where(eq(channelPublications.id, publication.id));
          throw err;
        }
      }),
    );

    const anySuccess = results.some((r) => r.status === "fulfilled");
    const finalStatus = anySuccess ? "published" : "approved";

    await this.db
      .update(listings)
      .set({
        status: finalStatus,
        publishedAt: anySuccess ? new Date() : listing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId));

    return {
      listingId,
      channels: results.map((r, i) => ({
        channel: channels[i]?.channel,
        status: r.status,
        externalId:
          r.status === "fulfilled" ? r.value.externalId : undefined,
        error: r.status === "rejected" ? String(r.reason) : undefined,
      })),
    };
  }
}
