import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { ModerationService } from "./moderation.service.js";
import { ModerationActionDto } from "./dto/moderation.dto.js";

@Controller("moderation")
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get("pending")
  findPending() {
    return this.moderationService.findPending();
  }

  @Post(":id/approve")
  async approve(@Param("id") id: string, @Body() dto: ModerationActionDto) {
    const listing = await this.moderationService.approve(id, dto);
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }

  @Post(":id/reject")
  async reject(@Param("id") id: string, @Body() dto: ModerationActionDto) {
    const listing = await this.moderationService.reject(id, dto);
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }
}
