import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateListingCommentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  authorName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;
}
