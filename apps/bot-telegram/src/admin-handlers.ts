import type { Bot, Context } from "grammy";
import { api } from "./api.js";

let cachedAdminChatId: string | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

export function invalidateAdminChatCache(): void {
  cachedAdminChatId = null;
  cacheLoadedAt = 0;
}

async function resolveAdminChatId(): Promise<string> {
  if (cachedAdminChatId && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedAdminChatId;
  }

  const envId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() ?? "";
  try {
    const cfg = await api.getTelegramConfig();
    cachedAdminChatId = cfg.adminChatId?.trim() || envId;
  } catch {
    cachedAdminChatId = envId;
  }
  cacheLoadedAt = Date.now();
  return cachedAdminChatId ?? "";
}

async function isAdminContext(ctx: Context): Promise<boolean> {
  const chatId = String(ctx.chat?.id ?? "");
  const userId = String(ctx.from?.id ?? "");
  const groupId = await resolveAdminChatId();
  if (groupId && chatId === groupId) return true;

  const allow = (process.env.TELEGRAM_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allow.includes(userId);
}

async function runAdminAction(
  ctx: Context,
  action: string,
  args: string[] = [],
): Promise<void> {
  if (!(await isAdminContext(ctx))) return;

  try {
    const { message } = await api.adminBotAction({
      chatId: String(ctx.chat?.id ?? ""),
      userId: String(ctx.from?.id ?? ""),
      userName: ctx.from?.username
        ? `@${ctx.from.username}`
        : ctx.from?.first_name,
      action,
      args,
    });
    await ctx.reply(message, { parse_mode: "HTML" });
  } catch (err) {
    const text = String(err).replace(/^Error:\s*/, "");
    await ctx.reply(`⚠️ ${text}`);
  }
}

function parseArgs(ctx: Context): string[] {
  const text = ctx.message?.text ?? "";
  return text.split(/\s+/).slice(1).filter(Boolean);
}

export function registerAdminHandlers(bot: Bot): void {
  const adminCommands = [
    "onayla",
    "approve",
    "reddet",
    "reject",
    "ilan",
    "odeme",
    "pay",
    "bekleyen",
    "moderasyon",
    "pending",
    "stat",
    "admin",
    "yardim",
    "help",
  ] as const;

  for (const cmd of adminCommands) {
    bot.command(cmd, async (ctx) => {
      if (!(await isAdminContext(ctx))) return;
      const args = parseArgs(ctx);
      await runAdminAction(ctx, cmd, args);
    });
  }

  bot.callbackQuery(/^adm:/, async (ctx) => {
    if (!(await isAdminContext(ctx))) {
      await ctx.answerCallbackQuery({ text: "Немає доступу", show_alert: true });
      return;
    }

    const raw = ctx.callbackQuery.data?.replace("adm:", "") ?? "";
    const [action, listingRef] = raw.split(":");
    if (!action || !listingRef) {
      await ctx.answerCallbackQuery();
      return;
    }

    await ctx.answerCallbackQuery();
    await runAdminAction(ctx, action, [listingRef]);
  });
}
