import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminService } from "../admin/admin.service.js";
import { BotsService } from "./bots.service.js";
import { CreateBotListingDto, UpdateBotListingDto } from "./dto/bot-listing.dto.js";
import { BotListingActionDto } from "./dto/bot-listing-action.dto.js";
import {
  BotPaymentPrepareDto,
  BotTelegramCompleteDto,
  BotTelegramPreCheckoutDto,
} from "./dto/bot-payment.dto.js";

@Controller("bots")
export class BotsController {
  constructor(
    private readonly adminService: AdminService,
    private readonly botsService: BotsService,
  ) {}

  private checkSecret(secret: string) {
    const expected = process.env.BOT_INTERNAL_SECRET ?? "dev-bot-secret";
    if (secret !== expected) throw new UnauthorizedException("Invalid bot secret");
  }

  @Get("telegram/menu")
  async telegramMenu(@Headers("x-bot-secret") secret: string) {
    this.checkSecret(secret);
    const config = await this.adminService.getActiveTelegramBotConfig();
    if (!config?.projectId) {
      return {
        data: {
          menu: this.adminService.parseBotMenu({}),
          channels: [],
        },
      };
    }
    return this.adminService.getTelegramBotMenu(config.projectId);
  }

  @Get("telegram/config")
  async telegramConfig(@Headers("x-bot-secret") secret: string) {
    this.checkSecret(secret);
    const config = await this.adminService.getActiveTelegramBotConfig();
    if (config?.botToken) {
      return {
        botToken: config.botToken,
        projectId: config.projectId,
        botUsername: config.botUsername,
        paymentProviderToken:
          process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN?.trim() || null,
      };
    }
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    return {
      botToken: token || null,
      projectId: null,
      botUsername: null,
      paymentProviderToken:
        process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN?.trim() || null,
    };
  }

  @Get("projects/:projectId/vacancy-types")
  async vacancyTypes(
    @Headers("x-bot-secret") secret: string,
    @Param("projectId") projectId: string,
  ) {
    this.checkSecret(secret);
    const data = await this.botsService.getVacancyTypes(projectId);
    return { data };
  }

  @Get("projects/:projectId/addons")
  async projectAddons(
    @Headers("x-bot-secret") secret: string,
    @Param("projectId") projectId: string,
  ) {
    this.checkSecret(secret);
    const data = await this.botsService.getProjectAddons(projectId);
    return { data };
  }

  @Post("listings")
  async createListing(
    @Headers("x-bot-secret") secret: string,
    @Body() dto: CreateBotListingDto,
  ) {
    this.checkSecret(secret);
    const listing = await this.botsService.createListing(dto);
    return { data: listing };
  }

  @Get("listings/:id")
  async getListing(
    @Headers("x-bot-secret") secret: string,
    @Param("id") id: string,
    @Query("channel") channel: string,
    @Query("externalUserId") externalUserId: string,
  ) {
    this.checkSecret(secret);
    const data = await this.botsService.getListingForEdit(
      id,
      channel,
      externalUserId,
    );
    return { data };
  }

  @Patch("listings/:id")
  async updateListing(
    @Headers("x-bot-secret") secret: string,
    @Param("id") id: string,
    @Body() dto: UpdateBotListingDto,
  ) {
    this.checkSecret(secret);
    const listing = await this.botsService.updateListing(id, dto);
    return { data: listing };
  }

  @Post("listings/:id/payment/prepare")
  async preparePayment(
    @Headers("x-bot-secret") secret: string,
    @Param("id") id: string,
    @Body() dto: BotPaymentPrepareDto,
  ) {
    this.checkSecret(secret);
    const data = await this.botsService.prepareListingPayment(id, dto);
    return { data };
  }

  @Post("payments/telegram/pre-checkout")
  async telegramPreCheckout(
    @Headers("x-bot-secret") secret: string,
    @Body() dto: BotTelegramPreCheckoutDto,
  ) {
    this.checkSecret(secret);
    return this.botsService.validateTelegramPreCheckout(dto);
  }

  @Post("payments/telegram/complete")
  async telegramPaymentComplete(
    @Headers("x-bot-secret") secret: string,
    @Body() dto: BotTelegramCompleteDto,
  ) {
    this.checkSecret(secret);
    const data = await this.botsService.completeTelegramPayment(dto);
    return { data };
  }

  @Post("listings/:id/resubmit")
  async resubmitListing(
    @Headers("x-bot-secret") secret: string,
    @Param("id") id: string,
    @Body() dto: BotListingActionDto,
  ) {
    this.checkSecret(secret);
    return this.botsService.resubmitUserListing(id, dto);
  }
}
