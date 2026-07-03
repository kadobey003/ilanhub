import { IsOptional, IsString, IsUUID } from "class-validator";

export class UploadMediaDto {
  @IsUUID()
  listingId!: string;

  @IsString()
  filename!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
