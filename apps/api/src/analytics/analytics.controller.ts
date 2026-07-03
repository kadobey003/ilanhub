import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";
import { TrackEventDto } from "./dto/analytics.dto.js";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("events")
  track(@Body() dto: TrackEventDto) {
    return this.analyticsService.track(dto);
  }

  @Get("stats")
  stats(@Query("projectId") projectId?: string) {
    return this.analyticsService.getStats(projectId);
  }
}
