import { Module, OnModuleInit } from "@nestjs/common";
import { QueueModule } from "../queue/queue.module.js";
import { AdminAuthController } from "./admin-auth.controller.js";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminController } from "./admin.controller.js";
import { AdminGuard } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";
import { UserMessagingService } from "./user-messaging.service.js";
import { AdminTelegramNotifyService } from "./admin-telegram-notify.service.js";
import { AdminBotService } from "./admin-bot.service.js";

@Module({
  imports: [QueueModule],
  controllers: [AdminController, AdminAuthController],
  providers: [
    AdminService,
    AdminAuthService,
    AdminGuard,
    UserMessagingService,
    AdminTelegramNotifyService,
    AdminBotService,
  ],
  exports: [
    AdminService,
    UserMessagingService,
    AdminTelegramNotifyService,
    AdminBotService,
  ],
})
export class AdminModule implements OnModuleInit {
  constructor(private readonly authService: AdminAuthService) {}

  async onModuleInit() {
    await this.authService.ensureDefaultAdmin();
  }
}
