import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module.js";
import { ListingsController } from "./listings.controller.js";
import { ProjectListingsController } from "./project-listings.controller.js";
import { ListingsService } from "./listings.service.js";
import { ListingsPublicService } from "./listings-public.service.js";

@Module({
  imports: [AdminModule],
  controllers: [ListingsController, ProjectListingsController],
  providers: [ListingsService, ListingsPublicService],
  exports: [ListingsService, ListingsPublicService],
})
export class ListingsModule {}
