import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BotsModule } from "../bots/bots.module.js";
import { ListingsModule } from "../listings/listings.module.js";
import { AccountController } from "./account.controller.js";
import { AccountService } from "./account.service.js";

@Module({
  imports: [AuthModule, BotsModule, ListingsModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
