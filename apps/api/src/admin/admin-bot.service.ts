import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { count, desc, eq, sql } from "drizzle-orm";
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
  buildAdminHelpMessage,
  buildAdminListingDetailMessage,
  buildAdminPendingListMessage,
  shortListingId,
  statusLabelUk,
  type AdminListingSnapshot,
} from "./admin-telegram-group.util.js";
import { AdminTelegramNotifyService } from "./admin-telegram-notify.service.js";

@Injectable()
export class AdminBotService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly adminService: AdminService,
    private readonly adminNotify: AdminTelegramNotifyService,
  ) {}

  async isAuthorizedChat(chatId: string, userId: string): Promise<boolean> {
    const groupId = await this.adminNotify.adminChatId();
    if (groupId && chatId === groupId) return true;

    const allow = (process.env.TELEGRAM_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return allow.includes(userId);
  }

  async resolveListingId(ref: string): Promise<string> {
    const trimmed = ref.trim().toLowerCase();
    if (!trimmed) throw new BadRequestException("Вкажіть ID оголошення");

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRe.test(trimmed)) {
      const [row] = await this.db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.id, trimmed))
        .limit(1);
      if (!row) throw new NotFoundException("Оголошення не знайдено");
      return row.id;
    }

    const rows = await this.db
      .select({ id: listings.id })
      .from(listings)
      .where(sql`${listings.id}::text ilike ${`${trimmed}%`}`)
      .limit(2);

    if (!rows.length) throw new NotFoundException("Оголошення не знайдено");
    if (rows.length > 1) {
      throw new BadRequestException(
        "Знайдено кілька оголошень — вкажіть довший ID",
      );
    }
    return rows[0]!.id;
  }

  private async loadSnapshot(listingId: string): Promise<AdminListingSnapshot> {
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

    if (!row) throw new NotFoundException("Оголошення не знайдено");

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

  async getListingInfo(ref: string): Promise<string> {
    const id = await this.resolveListingId(ref);
    const snapshot = await this.loadSnapshot(id);
    return buildAdminListingDetailMessage(snapshot);
  }

  async getPaymentInfo(ref: string): Promise<string> {
    const id = await this.resolveListingId(ref);
    const snapshot = await this.loadSnapshot(id);
    const sid = shortListingId(id);
    const price =
      snapshot.price != null && snapshot.price > 0
        ? `${snapshot.price} ₴`
        : "безкоштовно";

    const status =
      snapshot.paymentStatus === "completed"
        ? "✅ Оплачено"
        : snapshot.paymentStatus === "pending"
          ? "⏳ Очікує оплати"
          : snapshot.price && snapshot.price > 0
            ? "❌ Не оплачено"
            : "— не потрібна";

    return [
      `<b>💳 Оплата — ${sid}</b>`,
      "",
      `📄 ${snapshot.title ?? "Без назви"}`,
      `📊 Статус оголошення: ${statusLabelUk(snapshot.status)}`,
      `💰 Вартість: ${price}`,
      `💳 Оплата: ${status}`,
      snapshot.paymentMethod ? `🔧 Метод: ${snapshot.paymentMethod}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async listPending(): Promise<string> {
    const rows = await this.db
      .select({
        id: listings.id,
        title: listings.title,
        status: listings.status,
        price: listings.price,
      })
      .from(listings)
      .where(eq(listings.status, "pending_moderation"))
      .orderBy(desc(listings.updatedAt))
      .limit(20);

    return buildAdminPendingListMessage(rows);
  }

  async getStats(): Promise<string> {
    const [pendingMod] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.status, "pending_moderation"));
    const [pendingPay] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.status, "pending_payment"));
    const [published] = await this.db
      .select({ c: count() })
      .from(listings)
      .where(eq(listings.status, "published"));

    return [
      "<b>📊 Статистика</b>",
      "",
      `⏳ На модерації: <b>${pendingMod?.c ?? 0}</b>`,
      `💳 Очікує оплати: <b>${pendingPay?.c ?? 0}</b>`,
      `✅ Опубліковано: <b>${published?.c ?? 0}</b>`,
      "",
      "/bekleyen — список на модерації",
    ].join("\n");
  }

  helpText(): string {
    return buildAdminHelpMessage();
  }

  async approve(
    ref: string,
    note: string | undefined,
    actorName?: string,
  ): Promise<string> {
    const id = await this.resolveListingId(ref);
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!listing) throw new NotFoundException("Оголошення не знайдено");

    if (listing.status === "pending_payment") {
      throw new BadRequestException(
        "Оголошення ще не оплачено. Дочекайтеся оплати.",
      );
    }
    if (listing.status !== "pending_moderation") {
      throw new BadRequestException(
        `Неможливо схвалити — статус: ${statusLabelUk(listing.status)}`,
      );
    }

    await this.adminService.approveListing(id, {
      note: note?.trim() || (actorName ? `Telegram: ${actorName}` : undefined),
    });

    const sid = shortListingId(id);
    void this.adminNotify.notifyAdminText(
      `✅ <b>Схвалено</b> <code>${sid}</code>${actorName ? ` — ${actorName}` : ""}`,
      { projectId: listing.projectId },
    );
    return `✅ Оголошення <code>${sid}</code> схвалено та поставлено в чергу публікації.`;
  }

  async reject(
    ref: string,
    note: string | undefined,
    actorName?: string,
  ): Promise<string> {
    const id = await this.resolveListingId(ref);
    const [listing] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    if (!listing) throw new NotFoundException("Оголошення не знайдено");

    if (!["pending_moderation", "pending_payment"].includes(listing.status)) {
      throw new BadRequestException(
        `Неможливо відхилити — статус: ${statusLabelUk(listing.status)}`,
      );
    }

    await this.adminService.rejectListing(id, {
      note:
        note?.trim() ||
        (actorName ? `Відхилено через Telegram (${actorName})` : undefined),
    });

    const sid = shortListingId(id);
    void this.adminNotify.notifyAdminText(
      `❌ <b>Відхилено</b> <code>${sid}</code>${actorName ? ` — ${actorName}` : ""}`,
      { projectId: listing.projectId },
    );
    return `❌ Оголошення <code>${sid}</code> відхилено.`;
  }
}
