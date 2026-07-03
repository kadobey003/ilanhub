import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { ChannelsService } from "./channels.service.js";
import { CreateChannelDto } from "./dto/channel.dto.js";

@Controller("projects/:id/channels")
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  async findAll(@Param("id") projectId: string) {
    return this.channelsService.findByProject(projectId);
  }

  @Post()
  async create(
    @Param("id") projectId: string,
    @Body() dto: CreateChannelDto,
  ) {
    const channel = await this.channelsService.create(projectId, dto);
    if (!channel) throw new NotFoundException("Project not found");
    return channel;
  }
}
