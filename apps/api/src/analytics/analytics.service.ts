import { Inject, Injectable } from "@nestjs/common";
import { count, eq, sql } from "drizzle-orm";
import {
  analyticsEvents,
  dailyStats,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import type { TrackEventDto } from "./dto/analytics.dto.js";

@Injectable()
export class AnalyticsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async track(dto: TrackEventDto) {
    const [row] = await this.db
      .insert(analyticsEvents)
      .values({
        projectId: dto.projectId,
        listingId: dto.listingId,
        channel: dto.channel,
        eventType: dto.eventType,
        metadata: dto.metadata ?? {},
      })
      .returning();
    return row;
  }

  async getStats(projectId?: string) {
    const eventsQuery = this.db
      .select({
        eventType: analyticsEvents.eventType,
        total: count(),
      })
      .from(analyticsEvents)
      .groupBy(analyticsEvents.eventType);

    const events = projectId
      ? await eventsQuery.where(eq(analyticsEvents.projectId, projectId))
      : await eventsQuery;

    const daily = projectId
      ? await this.db
          .select()
          .from(dailyStats)
          .where(eq(dailyStats.projectId, projectId))
          .orderBy(sql`${dailyStats.date} DESC`)
          .limit(30)
      : await this.db
          .select()
          .from(dailyStats)
          .orderBy(sql`${dailyStats.date} DESC`)
          .limit(30);

    return { events, daily };
  }
}
