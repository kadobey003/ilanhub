import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { cities, districts, projects, type Database } from "@ilanhub/database";
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
    return this.db
      .select()
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.sortOrder));
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
