import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "./auth.guard.js";
import { AuthService } from "./auth.service.js";
import {
  BotContactDto,
  BotStartDto,
  LoginRequestDto,
  LoginVerifyDto,
  RegisterDto,
} from "./dto/auth.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.phone, dto.name);
  }

  @Get("link/:token/status")
  linkStatus(@Param("token") token: string) {
    return this.authService.linkStatus(token);
  }

  @Post("login/request")
  loginRequest(@Body() dto: LoginRequestDto) {
    return this.authService.requestLogin(dto.phone);
  }

  @Post("login/verify")
  loginVerify(@Body() dto: LoginVerifyDto) {
    return this.authService.verifyLogin(dto.phone, dto.code);
  }

  @Post("login/dev")
  devLogin() {
    return this.authService.devLogin();
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() req: { userId: string }) {
    return this.authService.me(req.userId);
  }

  @Post("bot/start")
  botStart(
    @Headers("x-bot-secret") secret: string,
    @Body() dto: BotStartDto,
  ) {
    this.authService.checkBotSecret(secret);
    return this.authService.handleBotStart(
      dto.telegramId,
      dto.startPayload,
      dto.firstName,
    );
  }

  @Post("bot/contact")
  botContact(
    @Headers("x-bot-secret") secret: string,
    @Body() dto: BotContactDto,
  ) {
    this.authService.checkBotSecret(secret);
    return this.authService.handleBotContact(
      dto.telegramId,
      dto.phone,
      dto.firstName,
    );
  }
}
