import { Type } from "class-transformer";
import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class WebAutoVehicleDto {
  @IsString()
  @MaxLength(64)
  brand!: string;

  @IsString()
  @MaxLength(128)
  model!: string;

  @IsInt()
  @Min(1980)
  @Max(2030)
  year!: number;

  @IsInt()
  @Min(0)
  mileage!: number;

  @IsIn(["petrol", "diesel", "gas", "hybrid", "electric"])
  fuelType!: string;

  @IsIn(["manual", "automatic"])
  transmission!: string;

  @IsOptional()
  @IsIn(["fwd", "rwd", "awd"])
  driveType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  engineVolume?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @IsIn(["new", "used", "damaged"])
  condition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(17)
  vin?: string;

  @IsInt()
  @Min(1)
  salePrice!: number;
}

export class CreateWebAutoListingDto {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  cityId!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

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

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  mediaUrls!: string[];

  @ValidateNested()
  @Type(() => WebAutoVehicleDto)
  vehicle!: WebAutoVehicleDto;
}

export class UploadAutoPhotoDto {
  @IsString()
  dataUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  watermarkTitle?: string;
}
