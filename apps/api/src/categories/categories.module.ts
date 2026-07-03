import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller.js";
import { CategoriesService } from "./categories.service.js";
import { ProjectsModule } from "../projects/projects.module.js";

@Module({
  imports: [ProjectsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
