import { Controller, Get } from "@nestjs/common";
import { SiteService } from "./site.service.js";

@Controller("site")
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get("branding")
  branding() {
    return this.siteService.getBrandingResponse();
  }
}
