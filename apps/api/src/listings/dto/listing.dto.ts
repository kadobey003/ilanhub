import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateListingDto {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;
}

export class UpdateListingDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsEnum([
    "draft",
    "pending_payment",
    "pending_moderation",
    "approved",
    "publishing",
    "published",
    "rejected",
    "expired",
  ])
  status?:
    | "draft"
    | "pending_payment"
    | "pending_moderation"
    | "approved"
    | "publishing"
    | "published"
    | "rejected"
    | "expired";
}
