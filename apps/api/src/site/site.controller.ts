import { Controller, Get } from "@nestjs/common";
import { SiteService } from "./site.service.js";

@Controller("site")
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get("branding")
  branding() {
    return this.siteService.getBrandingResponse();
  }

  @Get("telegram-channels")
  telegramChannels() {
    return this.siteService.getTelegramChannelsResponse();
  }

  @Get("social-presence")
  socialPresence() {
    return this.siteService.getSocialPresenceResponse();
  }
}
