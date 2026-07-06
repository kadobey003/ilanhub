import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { cities, districts, projects, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";

function dedupeCitiesBySlug<
  T extends { id: string; name: string; slug: string },
>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.slug)) return false;
    seen.add(row.slug);
    return true;
  });
}

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

    const rows = await this.db
      .select({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
      })
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.sortOrder), asc(cities.name));

    return dedupeCitiesBySlug(rows);
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
