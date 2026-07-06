import { i18n } from "@ilanhub/i18n";
import { api, type BotMenuData } from "./api.js";
import { buildMainMenuKeyboard, channelsKeyboard } from "./keyboards.js";

const TTL_MS = 60_000;

let cached: { at: number; data: BotMenuData } | null = null;

function fallbackMenu(): BotMenuData["menu"] {
  return {
    supportMessage: i18n.bot.supportMessage,
    siteUrl: process.env.PUBLIC_URL ?? "https://ilanhub.com",
    supportLabel: i18n.bot.support,
    siteLabel: i18n.bot.ourSite,
    channelsLabel: i18n.bot.ourChannels,
    showSupport: true,
    showSite: true,
    showChannels: true,
  };
}

export function invalidateBotMenuCache(): void {
  cached = null;
}

export async function getBotMenu(): Promise<BotMenuData> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  try {
    const res = await api.getTelegramMenu();
    cached = { at: Date.now(), data: res.data };
    return res.data;
  } catch (err) {
    console.warn("bot menu fetch failed:", err);
    return { menu: fallbackMenu(), channels: [] };
  }
}

export async function mainMenuKeyboard() {
  const { menu } = await getBotMenu();
  return buildMainMenuKeyboard(menu);
}

export async function replyChannelsList(
  reply: (text: string, extra?: { reply_markup?: ReturnType<typeof channelsKeyboard> }) => Promise<unknown>,
): Promise<void> {
  const { channels } = await getBotMenu();
  if (!channels.length) {
    await reply(i18n.bot.channelsEmpty);
    return;
  }
  await reply(i18n.bot.channelsListHeader, {
    reply_markup: channelsKeyboard(channels),
  });
}
