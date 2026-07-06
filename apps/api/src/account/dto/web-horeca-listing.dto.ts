import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { BotListingPositionDto } from "../../bots/dto/bot-listing.dto.js";

export class CreateWebHorecaListingDto {
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
  benefits?: string;

  @IsOptional()
  @IsBoolean()
  pinPost?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyDuplicate?: boolean;

  @IsOptional()
  @IsString()
  scheduledPostAt?: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BotListingPositionDto)
  positions!: BotListingPositionDto[];
}

export class UploadWebPhotoDto {
  @IsString()
  dataUrl!: string;
}
