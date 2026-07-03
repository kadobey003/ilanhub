import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { projects, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import type { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto.js";

@Injectable()
export class ProjectsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAll() {
    return this.db
      .select({
        id: projects.id,
        slug: projects.slug,
        name: projects.name,
        description: projects.description,
      })
      .from(projects)
      .where(eq(projects.isActive, true))
      .orderBy(asc(projects.name));
  }

  async findOne(id: string) {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    return row;
  }

  async create(dto: CreateProjectDto) {
    const [row] = await this.db
      .insert(projects)
      .values({
        slug: dto.slug,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return row;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const [row] = await this.db
      .update(projects)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return row;
  }

  async remove(id: string) {
    const [row] = await this.db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return row;
  }
}
