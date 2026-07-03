import { IsIn, IsString } from "class-validator";

export class BotListingActionDto {
  @IsIn(["telegram", "viber", "whatsapp"])
  channel!: "telegram" | "viber" | "whatsapp";

  @IsString()
  externalUserId!: string;
}
