import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module.js";
import { ModerationController } from "./moderation.controller.js";
import { ModerationService } from "./moderation.service.js";

@Module({
  imports: [AdminModule],
  controllers: [ModerationController],
  providers: [ModerationService],
})
export class ModerationModule {}
