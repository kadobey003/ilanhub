import { IsOptional, IsString } from "class-validator";

export class ModerationActionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  moderatorId!: string;
}
