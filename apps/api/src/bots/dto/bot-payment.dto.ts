import { IsInt, IsString, Min } from "class-validator";
import { BotListingActionDto } from "./bot-listing-action.dto.js";

export class BotPaymentPrepareDto extends BotListingActionDto {}

export class BotTelegramPreCheckoutDto extends BotListingActionDto {
  @IsString()
  payload!: string;

  @IsInt()
  @Min(1)
  totalAmount!: number;
}

export class BotTelegramCompleteDto extends BotListingActionDto {
  @IsString()
  payload!: string;

  @IsString()
  currency!: string;

  @IsInt()
  @Min(0)
  totalAmount!: number;

  @IsString()
  telegramPaymentChargeId!: string;

  @IsString()
  providerPaymentChargeId!: string;
}
