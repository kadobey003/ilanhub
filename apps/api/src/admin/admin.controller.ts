import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";
import { SiteService } from "../site/site.service.js";
import { UserMessagingService } from "./user-messaging.service.js";
import {
  AdminListingUpdateDto,
  AdminManagerCreateDto,
  AdminManagerUpdateDto,
  AdminUserCreateDto,
  AdminUserUpdateDto,
  ChannelCreateDto,
  ChannelUpdateDto,
  CategoryCreateDto,
  CategoryUpdateDto,
  CityCreateDto,
  CityUpdateDto,
  ModerationNoteDto,
  RegionCreateDto,
  RegionUpdateDto,
  PricingUpdateDto,
  ProjectPricingDto,
  ProjectCreateDto,
  TelegramSettingsDto,
  BrandingUpdateDto,
  BrandingLogoUploadDto,
  UserBroadcastDto,
  UserMessageDto,
  VacancyTypeUpdateDto,
  ProjectAddonUpdateDto,
} from "./dto/admin.dto.js";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userMessaging: UserMessagingService,
    private readonly siteService: SiteService,
  ) {}

  @Get("dashboard")
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get("listings")
  listings(
    @Query("status") status: string | undefined,
    @Req() req: { adminId: string; adminRole: string },
  ) {
    return this.adminService.listListings(status, req.adminId, req.adminRole);
  }

  @Get("listings/:id")
  listing(@Param("id") id: string, @Req() req: { adminId: string; adminRole: string }) {
    return this.adminService.getListing(id, req.adminId, req.adminRole);
  }

  @Post("listings/:id/approve")
  approve(
    @Param("id") id: string,
    @Body() dto: ModerationNoteDto,
    @Req() req: { adminId: string; adminRole: string },
  ) {
    return this.adminService.approveListing(id, dto, req.adminId, req.adminRole);
  }

  @Post("listings/:id/reject")
  reject(
    @Param("id") id: string,
    @Body() dto: ModerationNoteDto,
    @Req() req: { adminId: string; adminRole: string },
  ) {
    return this.adminService.rejectListing(id, dto, req.adminId, req.adminRole);
  }

  @Post("listings/:id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() dto: ModerationNoteDto,
    @Req() req: { adminId: string; adminRole: string },
  ) {
    return this.adminService.cancelListing(id, dto, req.adminId, req.adminRole);
  }

  @Post("listings/:id/republish")
  republish(@Param("id") id: string, @Req() req: { adminId: string; adminRole: string }) {
    return this.adminService.republishListing(id, req.adminId, req.adminRole);
  }

  @Patch("listings/:id")
  updateListing(
    @Param("id") id: string,
    @Body() dto: AdminListingUpdateDto,
    @Req() req: { adminId: string; adminRole: string },
  ) {
    return this.adminService.updateListing(id, dto, req.adminId, req.adminRole);
  }

  @Get("users")
  users() {
    return this.adminService.listUsers();
  }

  @Get("users/:id")
  userDetail(@Param("id") id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post("users")
  createUser(@Body() dto: AdminUserCreateDto) {
    return this.adminService.createUser(dto);
  }

  @Patch("users/:id")
  updateUser(@Param("id") id: string, @Body() dto: AdminUserUpdateDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Post("users/:id/message")
  sendUserMessage(@Param("id") id: string, @Body() dto: UserMessageDto) {
    return this.userMessaging.sendUserMessage(id, dto);
  }

  @Post("users/broadcast")
  broadcastUsers(@Body() dto: UserBroadcastDto) {
    return this.userMessaging.broadcastUsers(dto);
  }

  @Get("managers")
  managers(@Query("period") period?: "7d" | "30d" | "all") {
    return this.adminService.listManagers(period);
  }

  @Post("managers")
  createManager(@Body() dto: AdminManagerCreateDto) {
    return this.adminService.createManager(dto);
  }

  @Patch("managers/:id")
  updateManager(@Param("id") id: string, @Body() dto: AdminManagerUpdateDto) {
    return this.adminService.updateManager(id, dto);
  }

  @Delete("managers/:id")
  deleteManager(@Param("id") id: string) {
    return this.adminService.deleteManager(id);
  }

  @Get("projects")
  projects() {
    return this.adminService.listProjects();
  }

  @Post("projects")
  createProject(@Body() dto: ProjectCreateDto) {
    return this.adminService.createProject(dto);
  }

  @Patch("projects/:id")
  updateProject(@Param("id") id: string, @Body() dto: ProjectPricingDto) {
    return this.adminService.updateProjectPricing(id, dto);
  }

  @Delete("projects/:id")
  deleteProject(@Param("id") id: string) {
    return this.adminService.deleteProject(id);
  }

  @Get("channels")
  channels() {
    return this.adminService.listChannels();
  }

  @Get("regions")
  regions() {
    return this.adminService.listRegions();
  }

  @Post("regions")
  createRegion(@Body() dto: RegionCreateDto) {
    return this.adminService.createRegion(dto);
  }

  @Patch("regions/:id")
  updateRegion(@Param("id") id: string, @Body() dto: RegionUpdateDto) {
    return this.adminService.updateRegion(id, dto);
  }

  @Delete("regions/:id")
  deleteRegion(@Param("id") id: string) {
    return this.adminService.deleteRegion(id);
  }

  @Get("cities")
  cities() {
    return this.adminService.listCities();
  }

  @Post("cities")
  createCity(@Body() dto: CityCreateDto) {
    return this.adminService.createCity(dto);
  }

  @Patch("cities/:id")
  updateCity(@Param("id") id: string, @Body() dto: CityUpdateDto) {
    return this.adminService.updateCity(id, dto);
  }

  @Delete("cities/:id")
  deleteCity(@Param("id") id: string) {
    return this.adminService.deleteCity(id);
  }

  @Post("channels")
  createChannel(@Body() dto: ChannelCreateDto) {
    return this.adminService.createChannel(dto);
  }

  @Patch("channels/:id")
  updateChannel(@Param("id") id: string, @Body() dto: ChannelUpdateDto) {
    return this.adminService.updateChannel(id, dto);
  }

  @Delete("channels/:id")
  deleteChannel(@Param("id") id: string) {
    return this.adminService.deleteChannel(id);
  }

  @Get("categories")
  categories(@Query("projectId") projectId?: string) {
    return this.adminService.listCategories(projectId);
  }

  @Post("categories")
  createCategory(@Body() dto: CategoryCreateDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch("categories/:id")
  updateCategory(@Param("id") id: string, @Body() dto: CategoryUpdateDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete("categories/:id")
  deleteCategory(@Param("id") id: string) {
    return this.adminService.deleteCategory(id);
  }

  @Get("publications")
  publications(@Query("status") status?: string) {
    return this.adminService.listPublications(status);
  }

  @Post("publications/:id/retry")
  retryPublication(@Param("id") id: string) {
    return this.adminService.retryPublication(id);
  }

  @Post("publications/:id/remove")
  removePublication(@Param("id") id: string, @Req() req: { adminId: string }) {
    return this.adminService.removePublication(id, req.adminId);
  }

  @Post("publications/:id/pin")
  pinPublication(@Param("id") id: string) {
    return this.adminService.pinPublication(id);
  }

  @Post("publications/:id/feature")
  featurePublication(@Param("id") id: string) {
    return this.adminService.featurePublication(id);
  }

  @Post("publications/:id/republish")
  republishPublication(@Param("id") id: string) {
    return this.adminService.republishPublication(id);
  }

  @Get("payments")
  payments() {
    return this.adminService.listPayments();
  }

  @Get("analytics")
  analytics() {
    return this.adminService.analytics();
  }

  @Get("pricing")
  pricing(@Query("projectId") projectId?: string) {
    return this.adminService.listVacancyTypes(projectId);
  }

  @Patch("pricing/:id")
  updatePricing(@Param("id") id: string, @Body() dto: VacancyTypeUpdateDto) {
    return this.adminService.updateVacancyType(id, dto);
  }

  @Get("vacancy-types")
  vacancyTypes(@Query("projectId") projectId?: string) {
    return this.adminService.listVacancyTypes(projectId);
  }

  @Post("vacancy-types/init/:projectId")
  initVacancyPricing(@Param("projectId") projectId: string) {
    return this.adminService.initVacancyPricing(projectId);
  }

  @Patch("vacancy-types/:id")
  updateVacancyType(
    @Param("id") id: string,
    @Body() dto: VacancyTypeUpdateDto,
  ) {
    return this.adminService.updateVacancyType(id, dto);
  }

  @Get("project-addons")
  projectAddons(@Query("projectId") projectId?: string) {
    return this.adminService.listProjectAddons(projectId);
  }

  @Post("project-addons/init/:projectId")
  initProjectAddons(@Param("projectId") projectId: string) {
    return this.adminService.initProjectAddons(projectId);
  }

  @Patch("project-addons/:id")
  updateProjectAddon(
    @Param("id") id: string,
    @Body() dto: ProjectAddonUpdateDto,
  ) {
    return this.adminService.updateProjectAddon(id, dto);
  }

  @Get("settings/telegram")
  telegramSettings(@Query("projectId") projectId: string) {
    return this.adminService.getTelegramSettings(projectId);
  }

  @Patch("settings/telegram")
  saveTelegramSettings(@Body() dto: TelegramSettingsDto) {
    return this.adminService.saveTelegramSettings(dto);
  }

  @Post("settings/telegram/webhook")
  registerTelegramWebhook(@Body() body: { projectId: string }) {
    return this.adminService.registerTelegramWebhook(body.projectId);
  }

  @Get("settings/branding")
  brandingSettings() {
    return this.siteService.getBrandingResponse();
  }

  @Patch("settings/branding")
  saveBrandingSettings(@Body() dto: BrandingUpdateDto) {
    return this.siteService.updateBranding(dto.brandName);
  }

  @Post("settings/branding/logo")
  uploadBrandingLogo(@Body() dto: BrandingLogoUploadDto) {
    return this.siteService.uploadLogo(dto.dataUrl);
  }
}
