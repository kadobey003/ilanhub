import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { listings, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import { AdminTelegramNotifyService } from "../admin/admin-telegram-notify.service.js";
import type { CreateListingDto, UpdateListingDto } from "./dto/listing.dto.js";

@Injectable()
export class ListingsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly adminNotify: AdminTelegramNotifyService,
  ) {}

  findAll() {
    return this.db.select().from(listings);
  }

  async findOne(id: string) {
    const [row] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    return row;
  }

  async create(dto: CreateListingDto) {
    const [row] = await this.db
      .insert(listings)
      .values({
        projectId: dto.projectId,
        categoryId: dto.categoryId,
        userId: dto.userId,
        cityId: dto.cityId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        contactPhone: dto.contactPhone,
        status: "draft",
      })
      .returning();
    return row;
  }

  async update(id: string, dto: UpdateListingDto) {
    const [row] = await this.db
      .update(listings)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db
      .delete(listings)
      .where(eq(listings.id, id))
      .returning();
    return row;
  }

  async submit(id: string) {
    const listing = await this.findOne(id);
    if (!listing) return null;
    let nextStatus = listing.status;
    if (listing.status === "draft") {
      nextStatus =
        (listing.price ?? 0) > 0 ? "pending_payment" : "pending_moderation";
    }
    const [row] = await this.db
      .update(listings)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    if (row) {
      void this.adminNotify.notifyListingEvent(
        row.id,
        nextStatus === "pending_payment"
          ? "submitted_payment"
          : "submitted_moderation",
      );
    }
    return row;
  }
}
