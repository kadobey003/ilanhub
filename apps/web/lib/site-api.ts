import { API_URL } from "./api-url";

export interface PublicTelegramChannel {
  id: string;
  name: string;
  url: string;
  channelId: string;
  username?: string | null;
  projectSlug: string;
  projectName: string;
  cities: string[];
  memberCount: number | null;
  photoUrl: string | null;
  joinedThisWeek: number | null;
}

export interface TelegramChannelsData {
  channels: PublicTelegramChannel[];
  totalMembers: number;
  joinedThisWeek: number;
  botUsername: string | null;
}

export type SocialChannelType = "telegram" | "viber" | "whatsapp" | "instagram" | "web";

export interface PublicSocialChannel {
  id: string;
  name: string;
  url: string;
  handle: string | null;
  channel: SocialChannelType;
  projectSlug: string;
  projectName: string;
  cities: string[];
  memberCount: number | null;
  photoUrl: string | null;
}

export interface SocialBots {
  telegram: { username: string; url: string } | null;
  viber: { name: string; url: string | null } | null;
  whatsapp: { name: string; url: string | null } | null;
}

export interface SocialPresenceData {
  presence: Record<SocialChannelType, PublicSocialChannel[]>;
  bots: SocialBots;
  siteUrl: string;
}

export async function fetchTelegramChannels(): Promise<TelegramChannelsData> {
  const empty: TelegramChannelsData = {
    channels: [],
    totalMembers: 0,
    joinedThisWeek: 0,
    botUsername: null,
  };
  try {
    const res = await fetch(`${API_URL}/api/site/telegram-channels`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return empty;
    const json = await res.json();
    return json.data ?? empty;
  } catch {
    return empty;
  }
}

export async function fetchSocialPresence(): Promise<SocialPresenceData> {
  const empty: SocialPresenceData = {
    presence: { telegram: [], instagram: [], viber: [], whatsapp: [], web: [] },
    bots: { telegram: null, viber: null, whatsapp: null },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilanhub.com",
  };
  try {
    const res = await fetch(`${API_URL}/api/site/social-presence`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return empty;
    const json = await res.json();
    return json.data ?? empty;
  } catch {
    return empty;
  }
}
