import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { RegionsService } from "./regions.service.js";

@Controller("projects/:projectId/cities")
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  async findByProject(@Param("projectId") projectId: string) {
    const items = await this.regionsService.findCitiesByProjectId(projectId);
    if (items === null) throw new NotFoundException("Project not found");
    return { data: items };
  }
}
