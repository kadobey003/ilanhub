import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  cities,
  districts,
  projectChannelCities,
  projects,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";

@Injectable()
export class RegionsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findCitiesByProjectId(projectId: string) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!project) return null;

    const scoped = await this.db
      .selectDistinct({ cityId: projectChannelCities.cityId })
      .from(projectChannelCities)
      .where(eq(projectChannelCities.projectId, projectId));

    const scopedIds = scoped.map((row) => row.cityId);
    if (!scopedIds.length) {
      return this.db
        .select()
        .from(cities)
        .where(eq(cities.isActive, true))
        .orderBy(asc(cities.sortOrder));
    }

    return this.db
      .select()
      .from(cities)
      .where(and(eq(cities.isActive, true), inArray(cities.id, scopedIds)))
      .orderBy(asc(cities.sortOrder));
  }

  async findCitiesByProjectSlug(projectSlug: string) {
    const [project] = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, projectSlug))
      .limit(1);
    if (!project) return null;
    const rows = await this.findCitiesByProjectId(project.id);
    return rows?.map(({ slug, name }) => ({ slug, name })) ?? null;
  }

  async findDistrictsByCityId(cityId: string) {
    const [city] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    if (!city) return null;
    return this.db
      .select({
        id: districts.id,
        name: districts.name,
        slug: districts.slug,
      })
      .from(districts)
      .where(eq(districts.cityId, cityId))
      .orderBy(asc(districts.sortOrder));
  }
}
