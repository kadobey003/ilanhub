import { and, eq } from "drizzle-orm";
import { channelConfigs, type Database } from "@ilanhub/database";

type TgResponse = { ok: boolean; description?: string };

export function parseTelegramExternalId(
  externalId: string,
): { chatId: string; messageId: number } | null {
  const m = /^tg:(-?\d+):(\d+)$/.exec(externalId.trim());
  if (!m) return null;
  return { chatId: m[1]!, messageId: Number(m[2]) };
}

export async function resolveTelegramBotToken(
  db: Database,
  projectId?: string,
): Promise<string> {
  const rows = await db
    .select()
    .from(channelConfigs)
    .where(
      and(
        eq(channelConfigs.channel, "telegram"),
        eq(channelConfigs.purpose, "listing_input"),
        ...(projectId ? [eq(channelConfigs.projectId, projectId)] : []),
      ),
    );

  const row =
    rows.find((r) => r.isActive && r.projectId === projectId) ??
    rows.find((r) => r.isActive) ??
    rows.find((r) => Boolean((r.config as Record<string, unknown>).botToken));

  const fromDb = row
    ? String((row.config as Record<string, unknown>).botToken ?? "")
    : "";
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const token = fromDb || fromEnv;
  if (!token) throw new Error("Telegram bot token not configured");
  return token;
}

async function tgCall(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as TgResponse;
  if (!data.ok) {
    throw new Error(data.description ?? `${method} failed`);
  }
}

export async function deleteTelegramMessage(
  token: string,
  chatId: string,
  messageId: number,
): Promise<void> {
  await tgCall(token, "deleteMessage", { chat_id: chatId, message_id: messageId });
}

export async function pinTelegramMessage(
  token: string,
  chatId: string,
  messageId: number,
): Promise<void> {
  await tgCall(token, "pinChatMessage", {
    chat_id: chatId,
    message_id: messageId,
    disable_notification: false,
  });
}
