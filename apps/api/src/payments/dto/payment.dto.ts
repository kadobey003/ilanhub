import { IsEnum, IsInt, IsOptional, IsUUID, Min } from "class-validator";

export class CreatePaymentDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsEnum(["monopay", "portmone", "bank_transfer"])
  method!: "monopay" | "portmone" | "bank_transfer";

  @IsInt()
  @Min(1)
  amount!: number;
}
