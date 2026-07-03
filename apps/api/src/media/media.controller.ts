import { Body, Controller, Post } from "@nestjs/common";
import { MediaService } from "./media.service.js";
import { UploadMediaDto } from "./dto/media.dto.js";

@Controller("media")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post("upload")
  upload(@Body() dto: UploadMediaDto) {
    return this.mediaService.upload(dto);
  }
}
