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
import { AdminService } from "./admin.service.js";
import {
  isListingEventEnabled,
  isModerationActionsEnabled,
  type AdminGroupConfig,
} from "./admin-telegram-group-config.util.js";
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
    private readonly adminService: AdminService,
    private readonly userMessaging: UserMessagingService,
  ) {}

  async adminChatId(projectId?: string): Promise<string | null> {
    const group = projectId
      ? await this.adminService.getAdminGroupForProject(projectId)
      : await this.adminService.getActiveAdminGroup();
    if (!group.enabled || !group.chatId) return null;
    return group.chatId;
  }

  async isEnabled(projectId?: string): Promise<boolean> {
    return Boolean(await this.adminChatId(projectId));
  }

  private async loadSnapshot(
    listingId: string,
  ): Promise<(AdminListingSnapshot & { projectId: string }) | null> {
    const [row] = await this.db
      .select({
        listing: listings,
        projectId: listings.projectId,
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
      projectId: row.projectId,
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
    try {
      const snapshot = await this.loadSnapshot(listingId);
      if (!snapshot) return;

      const group = await this.adminService.getAdminGroupForProject(
        snapshot.projectId,
      );
      if (!isListingEventEnabled(group, event)) return;

      const chatId = group.enabled ? group.chatId : null;
      if (!chatId) return;

      const text = buildAdminListingNotifyMessage(event, snapshot);
      const markup =
        snapshot.status === "pending_moderation" ||
        snapshot.status === "pending_payment"
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

  async notifyAdminText(
    text: string,
    options?: { projectId?: string },
  ): Promise<void> {
    const group: AdminGroupConfig = options?.projectId
      ? await this.adminService.getAdminGroupForProject(options.projectId)
      : await this.adminService.getActiveAdminGroup();
    if (!isModerationActionsEnabled(group)) return;

    const chatId = group.chatId;
    if (!chatId) return;
    await this.userMessaging.sendTelegram(chatId, text, { parseMode: "HTML" });
  }
}
