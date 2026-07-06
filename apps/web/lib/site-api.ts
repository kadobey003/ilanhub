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
}

export interface TelegramChannelsData {
  channels: PublicTelegramChannel[];
  totalMembers: number;
}

export async function fetchTelegramChannels(): Promise<TelegramChannelsData> {
  const empty: TelegramChannelsData = { channels: [], totalMembers: 0 };
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
