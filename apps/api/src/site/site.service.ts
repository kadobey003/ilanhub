import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { BRAND_LOGO_PATH, BRAND_NAME, telegramPublicUrl, resolveChannelPublicUrl, resolveChannelHandle } from "@ilanhub/shared";
import {
  analyticsEvents,
  channelConfigs,
  cities,
  projectChannelCities,
  projects,
  siteBranding,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import { saveBrandingLogo } from "../branding/branding-upload.util.js";

export type PublicTelegramChannel = {
  id: string;
  name: string;
  url: string;
  channelId: string;
  projectSlug: string;
  projectName: string;
  cities: string[];
  memberCount: number | null;
  photoUrl: string | null;
  joinedThisWeek: number | null;
};

export type TelegramChannelsPayload = {
  channels: PublicTelegramChannel[];
  totalMembers: number;
  joinedThisWeek: number;
  botUsername: string | null;
};

export type PublicSocialChannel = {
  id: string;
  name: string;
  url: string;
  handle: string | null;
  channel: "telegram" | "viber" | "whatsapp" | "instagram" | "web";
  projectSlug: string;
  projectName: string;
  cities: string[];
  memberCount: number | null;
  photoUrl: string | null;
};

export type SocialBots = {
  telegram: { username: string; url: string } | null;
  viber: { name: string; url: string | null } | null;
  whatsapp: { name: string; url: string | null } | null;
};

export type SocialPresencePayload = {
  presence: Record<
    "telegram" | "instagram" | "viber" | "whatsapp" | "web",
    PublicSocialChannel[]
  >;
  bots: SocialBots;
  siteUrl: string;
};

const CHANNELS_CACHE_TTL_MS = 15 * 60 * 1000;
let channelsCache: {
  data: PublicTelegramChannel[];
  expires: number;
} | null = null;

@Injectable()
export class SiteService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getBranding() {
    const [row] = await this.db
      .select()
      .from(siteBranding)
      .where(eq(siteBranding.id, 1))
      .limit(1);

    return {
      brandName: row?.brandName ?? BRAND_NAME,
      logoUrl: row?.logoUrl ?? BRAND_LOGO_PATH,
    };
  }

  async getBrandingResponse() {
    return { data: await this.getBranding() };
  }

  private resolveBotToken(): string | null {
    return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  }

  private normalizeChatId(channelId: string): string | null {
    const raw = channelId.trim();
    if (!raw) return null;
    if (raw.startsWith("@") || /^-?\d+$/.test(raw)) return raw;
    if (/^[a-zA-Z0-9_]{4,}$/.test(raw)) return `@${raw}`;
    return raw;
  }

  private async resolveBotUsername(): Promise<string | null> {
    const fromEnv = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
    if (fromEnv) return fromEnv;

    const rows = await this.db
      .select({ config: channelConfigs.config })
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.channel, "telegram"),
          eq(channelConfigs.purpose, "listing_input"),
          eq(channelConfigs.isActive, true),
        ),
      )
      .limit(1);

    const username = String(
      (rows[0]?.config as Record<string, unknown> | undefined)?.botUsername ?? "",
    )
      .replace(/^@/, "")
      .trim();
    return username || null;
  }

  private async fetchChatMeta(
    token: string,
    channelId: string,
  ): Promise<{ memberCount: number | null; photoUrl: string | null }> {
    const chatId = this.normalizeChatId(channelId);
    if (!chatId) return { memberCount: null, photoUrl: null };

    try {
      const [countRes, chatRes] = await Promise.all([
        fetch(
          `https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(chatId)}`,
        ),
        fetch(
          `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(chatId)}`,
        ),
      ]);

      const countBody = (await countRes.json()) as {
        ok: boolean;
        result?: number;
      };
      const chatBody = (await chatRes.json()) as {
        ok: boolean;
        result?: { photo?: { small_file_id?: string } };
      };

      const memberCount =
        countBody.ok && typeof countBody.result === "number"
          ? countBody.result
          : null;

      let photoUrl: string | null = null;
      const fileId = chatBody.result?.photo?.small_file_id;
      if (fileId) {
        const fileRes = await fetch(
          `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
        );
        const fileBody = (await fileRes.json()) as {
          ok: boolean;
          result?: { file_path?: string };
        };
        if (fileBody.ok && fileBody.result?.file_path) {
          photoUrl = `https://api.telegram.org/file/bot${token}/${fileBody.result.file_path}`;
        }
      }

      return { memberCount, photoUrl };
    } catch {
      return { memberCount: null, photoUrl: null };
    }
  }

  private async recordMemberSnapshots(
    channels: PublicTelegramChannel[],
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const ch of channels) {
      if (ch.memberCount == null) continue;

      const [existing] = await this.db
        .select({ id: analyticsEvents.id })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, "telegram_member_snapshot"),
            sql`${analyticsEvents.metadata}->>'channelId' = ${ch.channelId}`,
            gte(analyticsEvents.createdAt, today),
          ),
        )
        .limit(1);

      if (existing) continue;

      await this.db.insert(analyticsEvents).values({
        eventType: "telegram_member_snapshot",
        channel: "telegram",
        metadata: {
          channelConfigId: ch.id,
          channelId: ch.channelId,
          memberCount: ch.memberCount,
        },
      });
    }
  }

  private async computeJoinedThisWeek(
    channels: PublicTelegramChannel[],
  ): Promise<number> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let total = 0;

    for (const ch of channels) {
      ch.joinedThisWeek = null;
      if (ch.memberCount == null) continue;

      const [oldSnapshot] = await this.db
        .select({ metadata: analyticsEvents.metadata })
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.eventType, "telegram_member_snapshot"),
            sql`${analyticsEvents.metadata}->>'channelId' = ${ch.channelId}`,
            lte(analyticsEvents.createdAt, weekAgo),
          ),
        )
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(1);

      if (!oldSnapshot) continue;

      const oldCount = Number(
        (oldSnapshot.metadata as Record<string, unknown>)?.memberCount ?? 0,
      );
      if (oldCount > 0 && ch.memberCount > oldCount) {
        ch.joinedThisWeek = ch.memberCount - oldCount;
        total += ch.joinedThisWeek;
      }
    }

    return total;
  }

  async getTelegramChannels(): Promise<PublicTelegramChannel[]> {
    if (channelsCache && Date.now() < channelsCache.expires) {
      return channelsCache.data;
    }

    const channelRows = await this.db
      .select({
        id: channelConfigs.id,
        name: channelConfigs.name,
        config: channelConfigs.config,
        projectSlug: projects.slug,
        projectName: projects.name,
      })
      .from(channelConfigs)
      .innerJoin(projects, eq(channelConfigs.projectId, projects.id))
      .where(
        and(
          eq(channelConfigs.channel, "telegram"),
          eq(channelConfigs.purpose, "publication"),
          eq(channelConfigs.isActive, true),
        ),
      )
      .orderBy(asc(projects.name), asc(channelConfigs.name));

    const cityLinks = await this.db
      .select({
        channelConfigId: projectChannelCities.channelConfigId,
        cityName: cities.name,
      })
      .from(projectChannelCities)
      .innerJoin(cities, eq(projectChannelCities.cityId, cities.id));

    const citiesByChannel = new Map<string, string[]>();
    for (const row of cityLinks) {
      const list = citiesByChannel.get(row.channelConfigId) ?? [];
      list.push(row.cityName);
      citiesByChannel.set(row.channelConfigId, list);
    }

    const token = this.resolveBotToken();
    const seen = new Set<string>();
    const pending: Array<{
      id: string;
      name: string;
      url: string;
      channelId: string;
      projectSlug: string;
      projectName: string;
      cities: string[];
    }> = [];

    for (const ch of channelRows) {
      const cfg = (ch.config ?? {}) as Record<string, unknown>;
      const channelId = String(cfg.channelId ?? "").trim();
      const url = telegramPublicUrl(channelId);
      if (!url || seen.has(channelId)) continue;
      seen.add(channelId);
      pending.push({
        id: ch.id,
        name: ch.name ?? channelId,
        url,
        channelId,
        projectSlug: ch.projectSlug,
        projectName: ch.projectName,
        cities: citiesByChannel.get(ch.id) ?? [],
      });
    }

    const metas = token
      ? await Promise.all(
          pending.map((ch) => this.fetchChatMeta(token, ch.channelId)),
        )
      : pending.map(() => ({ memberCount: null, photoUrl: null }));

    const result: PublicTelegramChannel[] = pending.map((ch, i) => ({
      ...ch,
      memberCount: metas[i]!.memberCount,
      photoUrl: metas[i]!.photoUrl,
      joinedThisWeek: null,
    }));

    await this.recordMemberSnapshots(result);

    channelsCache = { data: result, expires: Date.now() + CHANNELS_CACHE_TTL_MS };
    return result;
  }

  async getTelegramChannelsResponse(): Promise<{ data: TelegramChannelsPayload }> {
    const channels = await this.getTelegramChannels();
    const joinedThisWeek = await this.computeJoinedThisWeek(channels);
    const botUsername = await this.resolveBotUsername();
    const totalMembers = channels.reduce(
      (sum, ch) => sum + (ch.memberCount ?? 0),
      0,
    );
    return {
      data: { channels, totalMembers, joinedThisWeek, botUsername },
    };
  }

  private siteUrl(): string {
    return (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.PUBLIC_URL?.trim() ||
      "https://ilanhub.com"
    );
  }

  private async resolveInputBots(): Promise<SocialBots> {
    const rows = await this.db
      .select({
        channel: channelConfigs.channel,
        name: channelConfigs.name,
        config: channelConfigs.config,
      })
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.purpose, "listing_input"),
          eq(channelConfigs.isActive, true),
        ),
      );

    const bots: SocialBots = {
      telegram: null,
      viber: null,
      whatsapp: null,
    };

    const botUsername = await this.resolveBotUsername();
    if (botUsername) {
      bots.telegram = {
        username: botUsername,
        url: `https://t.me/${botUsername}`,
      };
    }

    for (const row of rows) {
      const cfg = (row.config ?? {}) as Record<string, unknown>;
      const url = resolveChannelPublicUrl(row.channel, cfg, this.siteUrl());
      if (row.channel === "viber" && !bots.viber) {
        bots.viber = { name: row.name ?? "Viber бот", url };
      }
      if (row.channel === "whatsapp" && !bots.whatsapp) {
        bots.whatsapp = { name: row.name ?? "WhatsApp бот", url };
      }
    }

    return bots;
  }

  async getSocialPresence(): Promise<SocialPresencePayload> {
    const emptyPresence = (): SocialPresencePayload["presence"] => ({
      telegram: [],
      instagram: [],
      viber: [],
      whatsapp: [],
      web: [],
    });

    const channelRows = await this.db
      .select({
        id: channelConfigs.id,
        name: channelConfigs.name,
        channel: channelConfigs.channel,
        config: channelConfigs.config,
        projectSlug: projects.slug,
        projectName: projects.name,
      })
      .from(channelConfigs)
      .innerJoin(projects, eq(channelConfigs.projectId, projects.id))
      .where(
        and(
          eq(channelConfigs.purpose, "publication"),
          eq(channelConfigs.isActive, true),
        ),
      )
      .orderBy(asc(projects.name), asc(channelConfigs.name));

    const cityLinks = await this.db
      .select({
        channelConfigId: projectChannelCities.channelConfigId,
        cityName: cities.name,
      })
      .from(projectChannelCities)
      .innerJoin(cities, eq(projectChannelCities.cityId, cities.id));

    const citiesByChannel = new Map<string, string[]>();
    for (const row of cityLinks) {
      const list = citiesByChannel.get(row.channelConfigId) ?? [];
      list.push(row.cityName);
      citiesByChannel.set(row.channelConfigId, list);
    }

    const telegramChannels = await this.getTelegramChannels();
    const telegramById = new Map(telegramChannels.map((ch) => [ch.id, ch]));

    const presence = emptyPresence();
    const seen = new Set<string>();

    for (const ch of channelRows) {
      const cfg = (ch.config ?? {}) as Record<string, unknown>;
      const url = resolveChannelPublicUrl(ch.channel, cfg, this.siteUrl());
      if (!url) continue;

      const dedupeKey = `${ch.channel}:${url}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const tg = ch.channel === "telegram" ? telegramById.get(ch.id) : null;
      const item: PublicSocialChannel = {
        id: ch.id,
        name: ch.name ?? ch.projectName,
        url,
        handle: resolveChannelHandle(ch.channel, cfg),
        channel: ch.channel,
        projectSlug: ch.projectSlug,
        projectName: ch.projectName,
        cities: citiesByChannel.get(ch.id) ?? [],
        memberCount: tg?.memberCount ?? null,
        photoUrl: tg?.photoUrl ?? null,
      };

      presence[ch.channel].push(item);
    }

    return {
      presence,
      bots: await this.resolveInputBots(),
      siteUrl: this.siteUrl(),
    };
  }

  async getSocialPresenceResponse(): Promise<{ data: SocialPresencePayload }> {
    return { data: await this.getSocialPresence() };
  }

  async updateBranding(brandName: string) {
    const name = brandName.trim();
    await this.db
      .insert(siteBranding)
      .values({ id: 1, brandName: name })
      .onConflictDoUpdate({
        target: siteBranding.id,
        set: { brandName: name, updatedAt: new Date() },
      });
    return this.getBrandingResponse();
  }

  async uploadLogo(dataUrl: string) {
    let logoUrl: string;
    try {
      logoUrl = await saveBrandingLogo(dataUrl);
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : "Logo upload failed",
      );
    }
    const [row] = await this.db
      .select({ brandName: siteBranding.brandName })
      .from(siteBranding)
      .where(eq(siteBranding.id, 1))
      .limit(1);

    await this.db
      .insert(siteBranding)
      .values({ id: 1, brandName: row?.brandName ?? BRAND_NAME, logoUrl })
      .onConflictDoUpdate({
        target: siteBranding.id,
        set: { logoUrl, updatedAt: new Date() },
      });

    return this.getBrandingResponse();
  }
}
