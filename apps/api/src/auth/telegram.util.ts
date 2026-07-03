const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN ?? "";
const BOT_USERNAME = () => process.env.TELEGRAM_BOT_USERNAME ?? "ilanhub_bot";

export function telegramDeepLink(payload: string): string {
  return `https://t.me/${BOT_USERNAME()}?start=${payload}`;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  const token = BOT_TOKEN();
  if (!token) return false;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    },
  );
  return res.ok;
}
