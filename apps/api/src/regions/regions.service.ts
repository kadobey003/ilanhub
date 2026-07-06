import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import {
  channelConfigs,
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

    return this.db
      .selectDistinct({
        id: cities.id,
        name: cities.name,
        slug: cities.slug,
      })
      .from(projectChannelCities)
      .innerJoin(
        channelConfigs,
        eq(projectChannelCities.channelConfigId, channelConfigs.id),
      )
      .innerJoin(cities, eq(projectChannelCities.cityId, cities.id))
      .where(
        and(
          eq(projectChannelCities.projectId, projectId),
          eq(channelConfigs.isActive, true),
          eq(cities.isActive, true),
        ),
      )
      .orderBy(asc(cities.sortOrder), asc(cities.name));
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
