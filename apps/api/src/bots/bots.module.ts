import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module.js";
import { UsersModule } from "../users/users.module.js";
import { BotsController } from "./bots.controller.js";
import { BotsAdminController } from "./bots-admin.controller.js";
import { BotsService } from "./bots.service.js";

@Module({
  imports: [AdminModule, UsersModule],
  controllers: [BotsController, BotsAdminController],
  providers: [BotsService],
  exports: [BotsService],
})
export class BotsModule {}
