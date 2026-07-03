import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service.js";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto.js";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async findAll() {
    const data = await this.projectsService.findAll();
    return { data };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const project = await this.projectsService.findOne(id);
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateProjectDto) {
    const project = await this.projectsService.update(id, dto);
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const project = await this.projectsService.remove(id);
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }
}
