import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { categories, projects, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  private async resolveProject(projectIdOrSlug: string) {
    const [byId] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectIdOrSlug))
      .limit(1);
    if (byId) return byId;

    const [bySlug] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, projectIdOrSlug))
      .limit(1);
    return bySlug;
  }

  async findByProjectId(projectIdOrSlug: string) {
    const project = await this.resolveProject(projectIdOrSlug);
    if (!project) return null;
    const items = await this.db
      .select()
      .from(categories)
      .where(
        and(eq(categories.projectId, project.id), eq(categories.isActive, true)),
      )
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return { data: items };
  }

  async findByProjectSlug(slug: string) {
    return this.findByProjectId(slug);
  }
}
