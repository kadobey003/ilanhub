import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard.js";
import { AccountService } from "./account.service.js";
import {
  CreateWebHorecaListingDto,
  UploadWebPhotoDto,
} from "./dto/web-horeca-listing.dto.js";

@Controller("account")
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get("dashboard")
  dashboard(@Req() req: { userId: string }) {
    return this.accountService.dashboard(req.userId);
  }

  @Get("listings")
  listings(@Req() req: { userId: string }) {
    return this.accountService.listings(req.userId);
  }

  @Get("projects/:projectId/vacancy-types")
  async vacancyTypes(@Param("projectId") projectId: string) {
    const data = await this.accountService.vacancyTypes(projectId);
    return { data };
  }

  @Get("projects/:projectId/addons")
  async projectAddons(@Param("projectId") projectId: string) {
    const data = await this.accountService.projectAddons(projectId);
    return { data };
  }

  @Get("projects/:projectId/horeca/category")
  async horecaCategory(@Param("projectId") projectId: string) {
    const category = await this.accountService.resolveHorecaCategory(projectId);
    if (!category) throw new NotFoundException("Category not found");
    return { data: category };
  }

  @Post("uploads")
  uploadPhoto(@Body() dto: UploadWebPhotoDto) {
    return this.accountService.uploadPhoto(dto.dataUrl);
  }

  @Post("listings/horeca")
  createHorecaListing(
    @Req() req: { userId: string },
    @Body() dto: CreateWebHorecaListingDto,
  ) {
    return this.accountService.createHorecaListing(req.userId, dto);
  }
}
