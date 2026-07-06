import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminBotService } from "../admin/admin-bot.service.js";

type AdminBotActionBody = {
  chatId: string;
  userId: string;
  userName?: string;
  action: string;
  args?: string[];
  listingRef?: string;
  note?: string;
};

@Controller("bots/admin")
export class BotsAdminController {
  constructor(private readonly adminBot: AdminBotService) {}

  private checkSecret(secret: string) {
    const expected = process.env.BOT_INTERNAL_SECRET ?? "dev-bot-secret";
    if (secret !== expected) throw new UnauthorizedException("Invalid bot secret");
  }

  private async assertAuth(body: AdminBotActionBody) {
    if (!(await this.adminBot.isAuthorizedChat(body.chatId, body.userId))) {
      throw new UnauthorizedException("Not an admin chat");
    }
  }

  @Post("action")
  async runAction(
    @Headers("x-bot-secret") secret: string,
    @Body() body: AdminBotActionBody,
  ) {
    this.checkSecret(secret);
    await this.assertAuth(body);

    const args = body.args ?? [];
    const ref = body.listingRef ?? args[0] ?? "";
    const note =
      body.note ?? (args.slice(1).join(" ").trim() || undefined);
    const actor = body.userName?.trim() || body.userId;

    let message: string;
    switch (body.action) {
      case "approve":
      case "onayla":
        message = await this.adminBot.approve(ref, note, actor);
        break;
      case "reject":
      case "reddet":
        message = await this.adminBot.reject(ref, note, actor);
        break;
      case "info":
      case "ilan":
        message = await this.adminBot.getListingInfo(ref);
        break;
      case "pay":
      case "odeme":
        message = await this.adminBot.getPaymentInfo(ref);
        break;
      case "pending":
      case "bekleyen":
      case "moderasyon":
        message = await this.adminBot.listPending();
        break;
      case "stat":
        message = await this.adminBot.getStats();
        break;
      case "help":
      case "admin":
      case "yardim":
        message = this.adminBot.helpText();
        break;
      default:
        message = this.adminBot.helpText();
    }

    return { message };
  }
}
