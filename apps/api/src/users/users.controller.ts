import { Controller, Get, Headers, NotFoundException, Param } from "@nestjs/common";
import { UsersService } from "./users.service.js";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async me(@Headers("x-user-id") userId?: string) {
    if (!userId) return { user: null };
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException("User not found");
    return { user };
  }

  @Get(":channel/:externalId/listings")
  async listingsByChannel(
    @Param("channel") channel: string,
    @Param("externalId") externalId: string,
  ) {
    return this.usersService.findListingsByChannel(channel, externalId);
  }

  @Get(":id/listings")
  async listings(@Param("id") id: string) {
    return this.usersService.findListings(id);
  }
}
