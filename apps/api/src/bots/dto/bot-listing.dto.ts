import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BotVehicleDto } from "./bot-vehicle.dto.js";

export class BotListingPositionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  workingHours?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsUUID()
  vacancyTypeId?: string;
}

export class CreateBotListingDto {
  @IsString()
  channel!: string;

  @IsString()
  externalUserId!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsUUID()
  projectId!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  districtId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  businessType?: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  listingPrice?: number;

  @IsOptional()
  @IsUUID()
  bundlePriceId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceStep?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BotListingPositionDto)
  positions?: BotListingPositionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BotVehicleDto)
  vehicle?: BotVehicleDto;
}

export class UpdateBotListingDto extends CreateBotListingDto {}
