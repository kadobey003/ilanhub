import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
} from "class-validator";

export class CreateChannelDto {
  @IsEnum(["telegram", "viber", "whatsapp", "instagram", "web"])
  channel!: "telegram" | "viber" | "whatsapp" | "instagram" | "web";

  @IsEnum(["listing_input", "publication"])
  purpose!: "listing_input" | "publication";

  @IsObject()
  config!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
