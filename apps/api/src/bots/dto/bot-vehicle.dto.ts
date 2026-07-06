import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class BotVehicleDto {
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
