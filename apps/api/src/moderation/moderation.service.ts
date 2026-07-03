import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { Queue } from "bullmq";
import {
  listings,
  moderationLogs,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE, PUBLISH_LISTING_QUEUE } from "../common/constants.js";
import type { PublishListingJob } from "../queue/queue.module.js";
import type { ModerationActionDto } from "./dto/moderation.dto.js";
import { UserMessagingService } from "../admin/user-messaging.service.js";

@Injectable()
export class ModerationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    @Inject(PUBLISH_LISTING_QUEUE)
    private readonly publishQueue: Queue<PublishListingJob>,
    private readonly userMessaging: UserMessagingService,
  ) {}

  findPending() {
    return this.db
      .select()
      .from(listings)
      .where(eq(listings.status, "pending_moderation"));
  }

  async approve(id: string, dto: ModerationActionDto) {
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!listing) return null;

    await this.db.insert(moderationLogs).values({
      listingId: id,
      moderatorId: dto.moderatorId,
      action: "approve",
      note: dto.note,
    });

    const [row] = await this.db
      .update(listings)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();

    await this.publishQueue.add("publish", { listingId: id });
    if (row) {
      void this.userMessaging.notifyListingModeration(
        { userId: row.userId, title: row.title },
        "approve",
        dto.note,
      );
    }
    return row;
  }

  async reject(id: string, dto: ModerationActionDto) {
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!listing) return null;

    await this.db.insert(moderationLogs).values({
      listingId: id,
      moderatorId: dto.moderatorId,
      action: "reject",
      note: dto.note,
    });

    const [row] = await this.db
      .update(listings)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    if (row) {
      void this.userMessaging.notifyListingModeration(
        { userId: row.userId, title: row.title },
        "reject",
        dto.note,
      );
    }
    return row;
  }
}
