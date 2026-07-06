import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ListingsService } from "./listings.service.js";
import { ListingsPublicService } from "./listings-public.service.js";
import { CreateListingCommentDto } from "./dto/listing-comment.dto.js";
import { CreateListingDto, UpdateListingDto } from "./dto/listing.dto.js";

@Controller("listings")
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly publicListings: ListingsPublicService,
  ) {}

  @Get()
  findAll() {
    return this.listingsService.findAll();
  }

  @Get(":id/engagement")
  async engagement(@Param("id") id: string) {
    const listing = await this.publicListings.findPublicById(id);
    if (!listing) throw new NotFoundException("Listing not found");
    const data = await this.publicListings.getEngagement(id);
    return { data };
  }

  @Post(":id/comments")
  async addComment(
    @Param("id") id: string,
    @Body() dto: CreateListingCommentDto,
  ) {
    const comment = await this.publicListings.addComment(
      id,
      dto.authorName,
      dto.body,
    );
    if (!comment) throw new NotFoundException("Listing not found");
    return { data: comment };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const listing = await this.publicListings.findPublicById(id);
    if (!listing) throw new NotFoundException("Listing not found");
    return { data: listing };
  }

  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateListingDto) {
    const listing = await this.listingsService.update(id, dto);
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const listing = await this.listingsService.remove(id);
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }

  @Post(":id/submit")
  async submit(@Param("id") id: string) {
    const listing = await this.listingsService.submit(id);
    if (!listing) throw new NotFoundException("Listing not found");
    return listing;
  }
}
