import { IsOptional, IsString, Length, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @Matches(/^\+?[\d\s()-]{9,20}$/)
  phone!: string;

  @IsString()
  @MinLength(2)
  @Length(2, 255)
  name!: string;
}

export class LoginRequestDto {
  @IsString()
  @Matches(/^\+?[\d\s()-]{9,20}$/)
  phone!: string;
}

export class LoginVerifyDto {
  @IsString()
  @Matches(/^\+?[\d\s()-]{9,20}$/)
  phone!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

export class BotStartDto {
  @IsString()
  telegramId!: string;

  @IsString()
  startPayload!: string;

  @IsOptional()
  @IsString()
  firstName?: string;
}

export class BotContactDto {
  @IsString()
  telegramId!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  firstName?: string;
}
