import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { BRAND_LOGO_PATH, BRAND_NAME, telegramPublicUrl } from "@ilanhub/shared";
import {
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
};

const CHANNELS_CACHE_TTL_MS = 15 * 60 * 1000;
let channelsCache: { data: PublicTelegramChannel[]; expires: number } | null =
  null;

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

  private async fetchMemberCount(
    token: string,
    channelId: string,
  ): Promise<number | null> {
    const raw = channelId.trim();
    if (!raw) return null;
    const chatId =
      raw.startsWith("@") || /^-?\d+$/.test(raw) ? raw : `@${raw}`;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(chatId)}`,
      );
      const body = (await res.json()) as { ok: boolean; result?: number };
      return body.ok && typeof body.result === "number" ? body.result : null;
    } catch {
      return null;
    }
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
    const result: PublicTelegramChannel[] = [];

    for (const ch of channelRows) {
      const cfg = (ch.config ?? {}) as Record<string, unknown>;
      const channelId = String(cfg.channelId ?? "").trim();
      const url = telegramPublicUrl(channelId);
      if (!url || seen.has(channelId)) continue;
      seen.add(channelId);

      const memberCount = token
        ? await this.fetchMemberCount(token, channelId)
        : null;

      result.push({
        id: ch.id,
        name: ch.name ?? channelId,
        url,
        channelId,
        projectSlug: ch.projectSlug,
        projectName: ch.projectName,
        cities: citiesByChannel.get(ch.id) ?? [],
        memberCount,
      });
    }

    channelsCache = { data: result, expires: Date.now() + CHANNELS_CACHE_TTL_MS };
    return result;
  }

  async getTelegramChannelsResponse() {
    const channels = await this.getTelegramChannels();
    const totalMembers = channels.reduce(
      (sum, ch) => sum + (ch.memberCount ?? 0),
      0,
    );
    return { data: { channels, totalMembers } };
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
