import { Inject, Injectable, Logger } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import {
  cities,
  listings,
  payments,
  projects,
  users,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import { UserMessagingService } from "./user-messaging.service.js";
import {
  adminListingInlineKeyboard,
  buildAdminListingNotifyMessage,
  type AdminListingEvent,
  type AdminListingSnapshot,
} from "./admin-telegram-group.util.js";

@Injectable()
export class AdminTelegramNotifyService {
  private readonly logger = new Logger(AdminTelegramNotifyService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly userMessaging: UserMessagingService,
  ) {}

  adminChatId(): string | null {
    const id = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
    return id || null;
  }

  isEnabled(): boolean {
    return Boolean(this.adminChatId());
  }

  private async loadSnapshot(listingId: string): Promise<AdminListingSnapshot | null> {
    const [row] = await this.db
      .select({
        listing: listings,
        projectName: projects.name,
        cityName: cities.name,
        userName: users.name,
        userTelegramId: users.telegramId,
      })
      .from(listings)
      .innerJoin(projects, eq(listings.projectId, projects.id))
      .leftJoin(cities, eq(listings.cityId, cities.id))
      .innerJoin(users, eq(listings.userId, users.id))
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!row) return null;

    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.listingId, listingId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    let paymentStatus: AdminListingSnapshot["paymentStatus"] = "none";
    if (payment) {
      paymentStatus =
        payment.status === "completed"
          ? "completed"
          : payment.status === "pending"
            ? "pending"
            : "none";
    }

    return {
      id: row.listing.id,
      title: row.listing.title,
      status: row.listing.status,
      price: row.listing.price,
      projectName: row.projectName,
      cityName: row.cityName,
      contactPhone: row.listing.contactPhone,
      sourceChannel: row.listing.sourceChannel,
      userName: row.userName,
      userTelegramId: row.userTelegramId,
      paymentStatus,
      paymentAmount: payment?.amount ?? row.listing.price,
      paymentMethod: payment?.method ?? null,
    };
  }

  async notifyListingEvent(
    listingId: string,
    event: AdminListingEvent,
  ): Promise<void> {
    const chatId = this.adminChatId();
    if (!chatId) return;

    try {
      const snapshot = await this.loadSnapshot(listingId);
      if (!snapshot) return;

      const text = buildAdminListingNotifyMessage(event, snapshot);
      const markup =
        snapshot.status === "pending_moderation"
          ? adminListingInlineKeyboard(listingId)
          : snapshot.status === "pending_payment"
            ? adminListingInlineKeyboard(listingId)
            : undefined;

      const result = await this.userMessaging.sendTelegram(chatId, text, {
        parseMode: "HTML",
        replyMarkup: markup,
      });
      if (!result.ok) {
        this.logger.warn(`Admin notify failed: ${result.error}`);
      }
    } catch (err) {
      this.logger.warn(
        `Admin notify error (${event}, ${listingId}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  async notifyAdminText(text: string): Promise<void> {
    const chatId = this.adminChatId();
    if (!chatId) return;
    await this.userMessaging.sendTelegram(chatId, text, { parseMode: "HTML" });
  }
}
