import { Injectable } from "@nestjs/common";
import { AdminService } from "../admin/admin.service.js";

@Injectable()
export class TelegramNotifyService {
  constructor(private readonly adminService: AdminService) {}

  private async botToken(): Promise<string | null> {
    const cfg = await this.adminService.getActiveTelegramBotConfig();
    if (cfg?.botToken) return cfg.botToken;
    const env = process.env.TELEGRAM_BOT_TOKEN?.trim();
    return env || null;
  }

  async botUsername(): Promise<string> {
    const cfg = await this.adminService.getActiveTelegramBotConfig();
    const fromDb = cfg?.botUsername?.replace(/^@/, "");
    if (fromDb) return fromDb;
    return (process.env.TELEGRAM_BOT_USERNAME ?? "ilanhub_bot").replace(/^@/, "");
  }

  async deepLink(payload: string): Promise<string> {
    const username = await this.botUsername();
    return `https://t.me/${username}?start=${payload}`;
  }

  async sendMessage(
    chatId: string,
    text: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const token = await this.botToken();
    if (!token) {
      return { ok: false, error: "Bot token not configured" };
    }

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      },
    );

    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as {
      description?: string;
    };
    return { ok: false, error: body.description ?? `HTTP ${res.status}` };
  }
}
