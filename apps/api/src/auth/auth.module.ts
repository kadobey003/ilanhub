import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module.js";
import { UsersModule } from "../users/users.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthGuard } from "./auth.guard.js";
import { TelegramNotifyService } from "./telegram-notify.service.js";

@Module({
  imports: [UsersModule, AdminModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, TelegramNotifyService],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
