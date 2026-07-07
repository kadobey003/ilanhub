import {
  fetchTelegramChannels,
  fetchSocialPresence,
  type PublicSocialChannel,
  type SocialPresenceData,
  type TelegramChannelsData,
} from "@/lib/site-api";
import { advertiseContactHref } from "@/lib/landing-promos";

export type LandingData = TelegramChannelsData & {
  social: SocialPresenceData;
  presence: SocialPresenceData["presence"];
  advertiseHref: string;
};

export async function getLandingData(): Promise<LandingData> {
  const [telegram, social] = await Promise.all([
    fetchTelegramChannels(),
    fetchSocialPresence(),
  ]);

  const telegramPresence: PublicSocialChannel[] =
    social.presence.telegram.length > 0
      ? social.presence.telegram
      : telegram.channels.map((ch) => {
          const raw = ch.channelId.trim();
          const handle =
            ch.username ??
            (raw.startsWith("@")
              ? raw
              : /^[a-zA-Z0-9_]{4,}$/.test(raw)
                ? `@${raw}`
                : null);
          return {
            id: ch.id,
            name: ch.name,
            url: ch.url,
            channelId: ch.channelId,
            handle,
            channel: "telegram" as const,
            projectSlug: ch.projectSlug,
            projectName: ch.projectName,
            cities: ch.cities,
            memberCount: ch.memberCount,
            photoUrl: ch.photoUrl,
          };
        });

  return {
    ...telegram,
    social,
    presence: { ...social.presence, telegram: telegramPresence },
    advertiseHref: advertiseContactHref(telegram.botUsername),
  };
}
