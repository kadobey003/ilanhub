import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AdminGuard } from "./admin.guard.js";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminLoginDto } from "./dto/admin-auth.dto.js";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly authService: AdminAuthService) {}

  @Post("login")
  login(@Body() dto: AdminLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get("me")
  @UseGuards(AdminGuard)
  me(@Req() req: { adminId: string }) {
    return this.authService.me(req.adminId);
  }
}
