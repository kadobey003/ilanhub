import type { Bot } from "grammy";
import type { BotSession } from "@ilanhub/shared";
import { i18n } from "@ilanhub/i18n";
import { mainMenuKeyboard } from "./bot-menu.js";
import { clearSession, getSession } from "./session.js";
import { brandLogo } from "./welcome.js";

const CHANNEL = "telegram" as const;
const IDLE_MS = Number(process.env.BOT_IDLE_TIMEOUT_MS ?? 5 * 60 * 1000);

type IdleEntry = { timer: ReturnType<typeof setTimeout>; chatId: number };

const timers = new Map<string, IdleEntry>();

function hasOpenSession(session: BotSession | null): session is BotSession {
  return session !== null;
}

export function cancelIdleReset(userId: string): void {
  const entry = timers.get(userId);
  if (!entry) return;
  clearTimeout(entry.timer);
  timers.delete(userId);
}

export function scheduleIdleReset(
  bot: Bot,
  userId: string,
  chatId: number,
): void {
  cancelIdleReset(userId);
  const timer = setTimeout(() => {
    void onIdle(bot, userId, chatId);
  }, IDLE_MS);
  timer.unref?.();
  timers.set(userId, { timer, chatId });
}

async function onIdle(bot: Bot, userId: string, chatId: number): Promise<void> {
  timers.delete(userId);
  const session = await getSession(CHANNEL, userId);
  if (!session || !hasOpenSession(session)) return;

  await clearSession(CHANNEL, userId);
  try {
    await bot.api.sendPhoto(chatId, brandLogo, {
      caption: i18n.bot.welcome,
      reply_markup: await mainMenuKeyboard(),
    });
  } catch (err) {
    console.warn("idle menu reset failed:", err);
  }
}

export async function touchIdleFromSession(
  bot: Bot,
  userId: string,
  chatId: number,
  session: BotSession | null,
): Promise<void> {
  if (hasOpenSession(session)) {
    scheduleIdleReset(bot, userId, chatId);
  } else {
    cancelIdleReset(userId);
  }
}
