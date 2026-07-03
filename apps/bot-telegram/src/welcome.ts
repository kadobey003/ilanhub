import { InputFile, type Context, type InlineKeyboard } from "grammy";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { i18n } from "@ilanhub/i18n";

const logoPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/logo.png",
);

export const brandLogo = new InputFile(logoPath);

export async function showWelcome(
  ctx: Context,
  replyMarkup: InlineKeyboard,
  opts?: { edit?: boolean },
): Promise<void> {
  const caption = i18n.bot.welcome;

  if (opts?.edit && ctx.callbackQuery?.message) {
    const msg = ctx.callbackQuery.message;
    if ("photo" in msg && msg.photo?.length) {
      try {
        await ctx.editMessageCaption({ caption, reply_markup: replyMarkup });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await ctx.editMessageText(caption, { reply_markup: replyMarkup });
      return;
    } catch {
      // fall through
    }
  }

  await ctx.replyWithPhoto(brandLogo, { caption, reply_markup: replyMarkup });
}
