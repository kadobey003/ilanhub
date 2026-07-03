import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class TrackEventDto {
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsEnum(["telegram", "viber", "whatsapp", "instagram", "web"])
  channel?: "telegram" | "viber" | "whatsapp" | "instagram" | "web";

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
