import type { Context, InlineKeyboard } from "grammy";

type ReplyOpts = {
  reply_markup?: InlineKeyboard;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
};

export async function replyOrEditText(
  ctx: Context,
  text: string,
  opts?: ReplyOpts,
): Promise<void> {
  const msg = ctx.callbackQuery?.message;
  if (msg) {
    if ("photo" in msg && msg.photo?.length) {
      try {
        await ctx.deleteMessage();
      } catch {
        // stale or already removed
      }
      await ctx.reply(text, opts);
      return;
    }
    try {
      await ctx.editMessageText(text, opts);
      return;
    } catch {
      // fall through to reply
    }
  }
  await ctx.reply(text, opts);
}
