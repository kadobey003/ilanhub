import { Module } from "@nestjs/common";
import { SiteController } from "./site.controller.js";
import { SiteService } from "./site.service.js";

@Module({
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
