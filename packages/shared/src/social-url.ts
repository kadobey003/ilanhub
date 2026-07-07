import { telegramPublicUrl } from "./telegram-url.js";

/** Resolve a public profile / community URL from channel config. */
export function resolveChannelPublicUrl(
  channel: string,
  config: Record<string, unknown>,
  fallbackSiteUrl?: string,
): string | null {
  const rawUrl = String(config.url ?? config.profileUrl ?? config.communityUrl ?? "").trim();
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;

  switch (channel) {
    case "telegram":
      return telegramPublicUrl(String(config.channelId ?? ""));
    case "instagram": {
      const username = String(config.username ?? config.handle ?? "")
        .replace(/^@/, "")
        .trim();
      return username ? `https://instagram.com/${username}` : null;
    }
    case "viber": {
      const uri = String(config.communityUri ?? config.uri ?? "").trim();
      if (uri.startsWith("viber://") || uri.startsWith("http")) return uri;
      return null;
    }
    case "whatsapp": {
      const phone = String(config.phone ?? config.phoneNumber ?? "").replace(/\D/g, "");
      if (phone) return `https://wa.me/${phone}`;
      return null;
    }
    case "web": {
      const base = String(config.baseUrl ?? fallbackSiteUrl ?? "").trim();
      return base || null;
    }
    default:
      return null;
  }
}

export function resolveChannelHandle(
  channel: string,
  config: Record<string, unknown>,
): string | null {
  switch (channel) {
    case "telegram": {
      const id = String(config.channelId ?? "").trim();
      if (id.startsWith("@")) return id;
      if (/^[a-zA-Z0-9_]{4,}$/.test(id)) return `@${id}`;
      return id || null;
    }
    case "instagram": {
      const h = String(config.username ?? config.handle ?? "").trim();
      return h ? (h.startsWith("@") ? h : `@${h}`) : null;
    }
    case "viber":
      return String(config.senderName ?? config.name ?? "").trim() || null;
    case "whatsapp":
      return String(config.displayName ?? config.phone ?? "").trim() || null;
    case "web":
      return "ilanhub.com";
    default:
      return null;
  }
}
