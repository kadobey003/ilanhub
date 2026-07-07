function isBadTelegramSiteUrl(raw: string): boolean {
  return /(?:^|\/\/)(?:www\.)?telegram\.org(?:\/|$)/i.test(raw);
}

/** Normalize href for off-site links (t.me without scheme, protocol-relative). */
export function normalizeExternalHref(url: string): string {
  const raw = url.trim();
  if (!raw) return raw;
  if (raw.startsWith("t.me/")) return `https://${raw}`;
  if (raw.startsWith("//")) return `https:${raw}`;
  return raw;
}

export function isOffSiteHref(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  return /^https?:\/\//i.test(raw) || raw.startsWith("//") || raw.startsWith("t.me/");
}

/** Build a public t.me link from Telegram channel id (@user or -100…). */
export function telegramPublicUrl(channelId: string): string | null {
  const raw = channelId.trim();
  if (!raw) return null;
  if (isBadTelegramSiteUrl(raw)) return null;
  if (raw === "https://t.me" || raw === "http://t.me") return null;
  if (raw.startsWith("https://t.me/") || raw.startsWith("http://t.me/")) return raw;
  if (raw.startsWith("t.me/")) return `https://${raw}`;
  if (raw.startsWith("+") && raw.length > 4) return `https://t.me/${raw}`;
  if (raw.startsWith("@")) return `https://t.me/${raw.slice(1)}`;
  const privateMatch = /^-100(\d+)$/.exec(raw);
  if (privateMatch) return `https://t.me/c/${privateMatch[1]}`;
  if (/^-?\d+$/.test(raw)) {
    const digits = raw.replace(/^-100/, "").replace(/^-/, "");
    return digits ? `https://t.me/c/${digits}` : null;
  }
  if (/^[a-zA-Z0-9_]{4,}$/.test(raw)) return `https://t.me/${raw}`;
  return null;
}

export type TelegramChannelConfig = {
  channelId?: string;
  username?: string;
  url?: string;
  inviteLink?: string;
  invite_link?: string;
  memberCount?: number | string;
};

/** Best public subscribe URL from config + optional live chat meta. */
export function resolveTelegramChannelUrl(
  config: TelegramChannelConfig | string,
  meta?: { username?: string | null; inviteLink?: string | null },
): string | null {
  const cfg: TelegramChannelConfig =
    typeof config === "string" ? { channelId: config } : config;

  const candidates = [
    cfg.inviteLink,
    cfg.invite_link,
    meta?.inviteLink,
    cfg.url,
    meta?.username,
    cfg.username,
    cfg.channelId,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const url = telegramPublicUrl(candidate);
    if (url) return url;
  }
  return null;
}

export function resolveTelegramHandle(
  config: TelegramChannelConfig | string,
  meta?: { username?: string | null },
): string | null {
  const cfg: TelegramChannelConfig =
    typeof config === "string" ? { channelId: config } : config;

  const raw = String(meta?.username ?? cfg.username ?? cfg.channelId ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("@")) return raw;
  if (/^[a-zA-Z0-9_]{4,}$/.test(raw)) return `@${raw}`;
  if (raw.startsWith("-") || /^\d+$/.test(raw)) return null;
  return null;
}

export function telegramBotUrl(username: string, start?: string): string {
  const user = username.replace(/^@/, "");
  return start
    ? `https://t.me/${user}?start=${encodeURIComponent(start)}`
    : `https://t.me/${user}`;
}
