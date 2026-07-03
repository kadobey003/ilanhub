import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ListingsPublicService } from "./listings-public.service.js";

@Controller("projects")
export class ProjectListingsController {
  constructor(private readonly publicListings: ListingsPublicService) {}

  @Get(":slug/listings")
  async projectListings(@Param("slug") slug: string) {
    const data = await this.publicListings.findPublishedByProject(slug);
    return { data };
  }

  @Get(":slug/cities/:citySlug/listings")
  async cityListings(
    @Param("slug") slug: string,
    @Param("citySlug") citySlug: string,
  ) {
    const data = await this.publicListings.findPublishedByProject(
      slug,
      citySlug,
    );
    return { data };
  }
}
