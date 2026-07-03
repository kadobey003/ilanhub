import { Body, Controller, Post } from "@nestjs/common";
import { WebhooksService } from "./webhooks.service.js";

@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("telegram")
  telegram(@Body() body: Record<string, unknown>) {
    return this.webhooksService.handleTelegram(body);
  }

  @Post("viber")
  viber(@Body() body: Record<string, unknown>) {
    return this.webhooksService.handleViber(body);
  }

  @Post("whatsapp")
  whatsapp(@Body() body: Record<string, unknown>) {
    return this.webhooksService.handleWhatsapp(body);
  }
}
