import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class ModerationNoteDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminListingUpdateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  price?: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminUserCreateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  telegramId?: string;

  @IsOptional()
  @IsString()
  viberId?: string;

  @IsOptional()
  @IsString()
  whatsappId?: string;
}

export class AdminUserUpdateDto extends AdminUserCreateDto {}

export class UserMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsIn(["telegram", "viber", "whatsapp"])
  channel?: "telegram" | "viber" | "whatsapp";
}

export class UserBroadcastDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @IsOptional()
  @IsIn(["telegram", "viber", "whatsapp", "all"])
  channel?: "telegram" | "viber" | "whatsapp" | "all";
}

export class ProjectPricingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProjectCreateDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PricingUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  listingQuota?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminManagerCreateDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  role?: "manager" | "super_admin";

  @IsOptional()
  projectIds?: string[];
}

export class AdminManagerUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: "manager" | "super_admin";

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  projectIds?: string[];
}

export class ChannelCreateDto {
  @IsString()
  projectId!: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @IsOptional()
  cityIds?: string[];
}

export class ChannelUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cityIds?: string[];
}

export class CategoryCreateDto {
  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegionCreateDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class RegionUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CityCreateDto {
  @IsOptional()
  @IsString()
  regionId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CityUpdateDto {
  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TelegramSettingsDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  botToken?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  supportMessage?: string;

  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  supportLabel?: string;

  @IsOptional()
  @IsString()
  siteLabel?: string;

  @IsOptional()
  @IsString()
  channelsLabel?: string;

  @IsOptional()
  @IsBoolean()
  showSupport?: boolean;

  @IsOptional()
  @IsBoolean()
  showSite?: boolean;

  @IsOptional()
  @IsBoolean()
  showChannels?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  pinPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyDuplicatePrice?: number;

  @IsOptional()
  @IsString()
  adminChatId?: string;

  @IsOptional()
  @IsBoolean()
  adminGroupEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  notifySubmittedPayment?: boolean;

  @IsOptional()
  @IsBoolean()
  notifySubmittedModeration?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyPaymentReceived?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyResubmitted?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyModerationActions?: boolean;
}

export class BrandingUpdateDto {
  @IsString()
  brandName!: string;
}

export class BrandingLogoUploadDto {
  @IsString()
  dataUrl!: string;
}

export class VacancyTypeUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProjectAddonUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsIn(["fixed", "per_vacancy"])
  billingUnit?: "fixed" | "per_vacancy";

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
