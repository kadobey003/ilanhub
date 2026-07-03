import { Injectable } from "@nestjs/common";

@Injectable()
export class WebhooksService {
  handleTelegram(body: Record<string, unknown>) {
    return { ok: true, channel: "telegram", received: Boolean(body) };
  }

  handleViber(body: Record<string, unknown>) {
    return { ok: true, channel: "viber", received: Boolean(body) };
  }

  handleWhatsapp(body: Record<string, unknown>) {
    return { ok: true, channel: "whatsapp", received: Boolean(body) };
  }
}
