/** Build a public t.me link from Telegram channel id (@user or -100…). */
export function telegramPublicUrl(channelId: string): string | null {
  const raw = channelId.trim();
  if (!raw) return null;
  if (raw.startsWith("https://t.me/") || raw.startsWith("http://t.me/")) return raw;
  if (raw.startsWith("@")) return `https://t.me/${raw.slice(1)}`;
  if (raw.startsWith("t.me/")) return `https://${raw}`;
  const privateMatch = /^-100(\d+)$/.exec(raw);
  if (privateMatch) return `https://t.me/c/${privateMatch[1]}`;
  if (/^\d+$/.test(raw)) return `https://t.me/c/${raw}`;
  if (/^[a-zA-Z0-9_]{4,}$/.test(raw)) return `https://t.me/${raw}`;
  return null;
}

export function telegramBotUrl(username: string, start?: string): string {
  const user = username.replace(/^@/, "");
  return start
    ? `https://t.me/${user}?start=${encodeURIComponent(start)}`
    : `https://t.me/${user}`;
}
