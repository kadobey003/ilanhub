import { Injectable, Inject } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { listings, projects, users, type Database } from "@ilanhub/database";
import { normalizePhone } from "@ilanhub/shared";
import { DRIZZLE } from "../common/constants.js";

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findOne(id: string) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row;
  }

  async findByPhone(phone: string) {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, normalized))
      .limit(1);
    return row;
  }

  async findByChannel(channel: string, externalId: string) {
    const column =
      channel === "telegram"
        ? users.telegramId
        : channel === "viber"
          ? users.viberId
          : channel === "whatsapp"
            ? users.whatsappId
            : null;
    if (!column) return null;

    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(column, externalId))
      .limit(1);
    return row;
  }

  async create(data: { phone: string; name?: string; telegramId?: string }) {
    const [row] = await this.db
      .insert(users)
      .values({
        phone: data.phone,
        name: data.name,
        telegramId: data.telegramId,
        phoneVerifiedAt: data.telegramId ? new Date() : undefined,
      })
      .returning();
    return row!;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [row] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return row!;
  }

  async findOrCreateByTelegram(telegramId: string, name?: string) {
    const existing = await this.findByChannel("telegram", telegramId);
    if (existing) {
      if (name && name !== existing.name) {
        return this.update(existing.id, { name });
      }
      return existing;
    }
    const [row] = await this.db
      .insert(users)
      .values({ telegramId, name })
      .returning();
    return row!;
  }

  async linkTelegram(telegramId: string, phoneRaw: string, name?: string) {
    const phone = normalizePhone(phoneRaw);
    if (!phone) throw new Error("Invalid phone");

    const byPhone = await this.findByPhone(phone);
    const byTg = await this.findByChannel("telegram", telegramId);

    if (byPhone && byTg && byPhone.id !== byTg.id) {
      return this.mergeUsers(byPhone.id, byTg.id, { telegramId, name });
    }

    if (byPhone) {
      return this.update(byPhone.id, {
        telegramId,
        phoneVerifiedAt: new Date(),
        name: name ?? byPhone.name,
      });
    }

    if (byTg) {
      return this.update(byTg.id, {
        phone,
        phoneVerifiedAt: new Date(),
        name: name ?? byTg.name,
      });
    }

    return this.create({ phone, name, telegramId });
  }

  private async mergeUsers(
    keepId: string,
    mergeId: string,
    extra: { telegramId: string; name?: string },
  ) {
    await this.db
      .update(listings)
      .set({ userId: keepId, updatedAt: new Date() })
      .where(eq(listings.userId, mergeId));

    const [keep] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, keepId))
      .limit(1);
    const [merge] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, mergeId))
      .limit(1);

    await this.db.delete(users).where(eq(users.id, mergeId));

    return this.update(keepId, {
      telegramId: extra.telegramId,
      viberId: keep?.viberId ?? merge?.viberId,
      whatsappId: keep?.whatsappId ?? merge?.whatsappId,
      phoneVerifiedAt: new Date(),
      name: extra.name ?? keep?.name ?? merge?.name,
    });
  }

  async findListings(userId: string) {
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

  async findListingForUser(userId: string, listingId: string) {
    const [row] = await this.db
      .select({ listing: listings, project: projects })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!row || row.listing.userId !== userId) return null;
    return {
      id: row.listing.id,
      title: row.listing.title,
      description: row.listing.description,
      status: row.listing.status,
      price: row.listing.price,
      currency: row.listing.currency,
      project: row.project.name,
      projectSlug: row.project.slug,
      createdAt: row.listing.createdAt,
      publishedAt: row.listing.publishedAt,
      contactPhone: row.listing.contactPhone,
    };
  }

  async findListingsByChannel(channel: string, externalId: string) {
    const user = await this.findByChannel(channel, externalId);
    if (!user) return { data: [] };
    return this.findListings(user.id);
  }
}
