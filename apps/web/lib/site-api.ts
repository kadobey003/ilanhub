import { API_URL } from "./api-url";

export interface PublicTelegramChannel {
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
}

export interface TelegramChannelsData {
  channels: PublicTelegramChannel[];
  totalMembers: number;
  joinedThisWeek: number;
  botUsername: string | null;
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
