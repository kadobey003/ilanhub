import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { channelConfigs, users, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import type { UserBroadcastDto, UserMessageDto } from "./dto/admin.dto.js";
import {
  buildModerationMessage,
  type ModerationNotifyAction,
} from "./moderation-notify.util.js";

type Channel = "telegram" | "viber" | "whatsapp";

export type SendResult = {
  channel: Channel;
  ok: boolean;
  error?: string;
};

function detectChannel(user: {
  telegramId: string | null;
  viberId: string | null;
  whatsappId: string | null;
}): Channel | "web" {
  if (user.telegramId) return "telegram";
  if (user.viberId) return "viber";
  if (user.whatsappId) return "whatsapp";
  return "web";
}

function matchesChannelFilter(
  user: {
    telegramId: string | null;
    viberId: string | null;
    whatsappId: string | null;
  },
  filter: "telegram" | "viber" | "whatsapp" | "all" | undefined,
): boolean {
  if (!filter || filter === "all") return detectChannel(user) !== "web";
  if (filter === "telegram") return Boolean(user.telegramId);
  if (filter === "viber") return Boolean(user.viberId);
  return Boolean(user.whatsappId);
}

@Injectable()
export class UserMessagingService {
  private readonly logger = new Logger(UserMessagingService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async telegramToken(): Promise<string | null> {
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

    if (row) {
      const token = String((row.config as Record<string, unknown>).botToken ?? "");
      if (token) return token;
    }

    return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  }

  async sendTelegram(
    chatId: string,
    text: string,
    opts?: {
      parseMode?: "HTML" | "Markdown";
      replyMarkup?: Record<string, unknown>;
    },
  ): Promise<{ ok: boolean; error?: string }> {
    const token = await this.telegramToken();
    if (!token) return { ok: false, error: "Telegram bot token not configured" };

    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
    };
    if (opts?.parseMode) payload.parse_mode = opts.parseMode;
    if (opts?.replyMarkup) payload.reply_markup = opts.replyMarkup;

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { description?: string };
    return { ok: false, error: body.description ?? `HTTP ${res.status}` };
  }

  async sendViber(
    receiver: string,
    text: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const token = process.env.VIBER_AUTH_TOKEN?.trim();
    if (!token) return { ok: false, error: "Viber token not configured" };

    const res = await fetch("https://chatapi.viber.com/pa/send_message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Viber-Auth-Token": token,
      },
      body: JSON.stringify({
        receiver,
        type: "text",
        text,
        min_api_version: 7,
      }),
    });

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const body = (await res.json().catch(() => ({}))) as {
      status?: number;
      status_message?: string;
    };
    if (body.status === 0) return { ok: true };
    return { ok: false, error: body.status_message ?? "Viber API error" };
  }

  async sendWhatsApp(
    to: string,
    text: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const waToken = process.env.WHATSAPP_TOKEN?.trim();
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!waToken || !phoneId) {
      return { ok: false, error: "WhatsApp not configured" };
    }

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      },
    );

    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` };
  }

  async sendToUser(
    user: {
      telegramId: string | null;
      viberId: string | null;
      whatsappId: string | null;
    },
    message: string,
    channel?: Channel,
  ): Promise<SendResult> {
    const target = channel ?? detectChannel(user);
    if (target === "web") {
      return { channel: "telegram", ok: false, error: "Користувач без месенджера" };
    }

    switch (target) {
      case "telegram":
        if (!user.telegramId) {
          return { channel: target, ok: false, error: "Немає Telegram ID" };
        }
        return { channel: target, ...(await this.sendTelegram(user.telegramId, message)) };
      case "viber":
        if (!user.viberId) {
          return { channel: target, ok: false, error: "Немає Viber ID" };
        }
        return { channel: target, ...(await this.sendViber(user.viberId, message)) };
      case "whatsapp":
        if (!user.whatsappId) {
          return { channel: target, ok: false, error: "Немає WhatsApp ID" };
        }
        return { channel: target, ...(await this.sendWhatsApp(user.whatsappId, message)) };
    }
  }

  async notifyListingModeration(
    listing: { userId: string; title: string | null },
    action: ModerationNotifyAction,
    note?: string | null,
  ): Promise<SendResult | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, listing.userId))
      .limit(1);
    if (!user) return null;

    const message = buildModerationMessage(action, listing.title ?? "Оголошення", note);
    const result = await this.sendToUser(user, message);
    if (!result.ok) {
      this.logger.warn(
        `Moderation notify failed (${action}, user ${listing.userId}): ${result.error}`,
      );
    }
    return result;
  }

  async sendUserMessage(userId: string, dto: UserMessageDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new NotFoundException("User not found");

    const result = await this.sendToUser(user, dto.message, dto.channel);
    return {
      userId,
      userName: user.name,
      ...result,
    };
  }

  async broadcastUsers(dto: UserBroadcastDto) {
    let targets = await this.db.select().from(users);

    if (dto.userIds?.length) {
      targets = targets.filter((u) => dto.userIds!.includes(u.id));
    } else if (dto.userIds && dto.userIds.length === 0) {
      targets = [];
    }

    const filter = dto.channel ?? "all";
    targets = targets.filter((u) => matchesChannelFilter(u, filter));

    const results: Array<{
      userId: string;
      userName: string | null;
      channel: Channel;
      ok: boolean;
      error?: string;
    }> = [];

    for (const user of targets) {
      const channel =
        filter === "all" ? undefined : (filter as Channel);
      const result = await this.sendToUser(user, dto.message, channel);
      results.push({
        userId: user.id,
        userName: user.name,
        ...result,
      });
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;

    return { sent, failed, total: results.length, results };
  }
}
