import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { CategoriesService } from "./categories.service.js";

@Controller("projects/:projectId/categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findByProject(@Param("projectId") projectId: string) {
    const result = await this.categoriesService.findByProjectId(projectId);
    if (result === null) throw new NotFoundException("Project not found");
    return result;
  }
}
