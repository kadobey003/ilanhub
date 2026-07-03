import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  channelConfigs,
  projects,
  type Database,
} from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import type { CreateChannelDto } from "./dto/channel.dto.js";

@Injectable()
export class ChannelsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByProject(projectId: string) {
    return this.db
      .select()
      .from(channelConfigs)
      .where(eq(channelConfigs.projectId, projectId));
  }

  async create(projectId: string, dto: CreateChannelDto) {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    if (!project) return null;

    const [row] = await this.db
      .insert(channelConfigs)
      .values({
        projectId,
        channel: dto.channel,
        purpose: dto.purpose,
        config: dto.config,
        isActive: dto.isActive ?? true,
      })
      .returning();
    return row;
  }
}
