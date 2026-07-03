import { Module } from "@nestjs/common";
import { DistrictsController } from "./districts.controller.js";
import { RegionsController } from "./regions.controller.js";
import { RegionsService } from "./regions.service.js";

@Module({
  controllers: [RegionsController, DistrictsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
