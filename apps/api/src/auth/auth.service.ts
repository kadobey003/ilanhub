import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { generateOtp, normalizeAuthPhone } from "@ilanhub/shared";
import { REDIS } from "../common/constants.js";
import type { Redis } from "ioredis";
import type { users } from "@ilanhub/database";
import { signToken } from "./jwt.util.js";
import { TelegramNotifyService } from "./telegram-notify.service.js";
import { UsersService } from "../users/users.service.js";

const LINK_TTL = 900;
const OTP_TTL = 300;

interface LinkSession {
  userId: string;
  phone: string;
  name: string;
  purpose: "register" | "link";
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly usersService: UsersService,
    private readonly telegram: TelegramNotifyService,
  ) {}

  private jwtSecret() {
    return process.env.JWT_SECRET ?? "change-me";
  }

  private toPublicUser(user: typeof users.$inferSelect) {
    return {
      id: user.id,
      phone: user.phone,
      name: user.name,
      telegramId: user.telegramId,
      phoneVerified: !!user.phoneVerifiedAt,
      locale: user.locale,
    };
  }

  private issueToken(user: typeof users.$inferSelect) {
    if (!user.phone) throw new BadRequestException("Phone required");
    return {
      accessToken: signToken(user.id, user.phone, this.jwtSecret()),
      user: this.toPublicUser(user),
    };
  }

  async register(phoneRaw: string, name: string) {
    const phone = normalizeAuthPhone(phoneRaw);
    if (!phone) throw new BadRequestException("Invalid phone number");

    const existing = await this.usersService.findByPhone(phone);
    if (existing?.phoneVerifiedAt) {
      throw new ConflictException("Phone already registered");
    }

    let user = existing;
    if (!user) {
      user = await this.usersService.create({ phone, name });
    } else {
      user = await this.usersService.update(user.id, { name });
    }

    const token = randomBytes(16).toString("hex");
    const session: LinkSession = {
      userId: user.id,
      phone,
      name,
      purpose: "register",
    };
    await this.redis.setex(`auth:link:${token}`, LINK_TTL, JSON.stringify(session));

    return {
      linkToken: token,
      telegramUrl: await this.telegram.deepLink(`link_${token}`),
      expiresIn: LINK_TTL,
      userId: user.id,
    };
  }

  async linkStatus(token: string) {
    const raw = await this.redis.get(`auth:link:${token}`);
    if (!raw) return { status: "expired" as const };

    const session = JSON.parse(raw) as LinkSession;
    const user = await this.usersService.findOne(session.userId);
    if (user?.phoneVerifiedAt && user.telegramId) {
      await this.redis.del(`auth:link:${token}`);
      return { status: "verified" as const, ...this.issueToken(user) };
    }
    return { status: "pending" as const };
  }

  async requestLogin(phoneRaw: string) {
    const phone = normalizeAuthPhone(phoneRaw);
    if (!phone) throw new BadRequestException("Invalid phone number");

    const user = await this.usersService.findByPhone(phone);
    if (!user?.phoneVerifiedAt || !user.telegramId) {
      throw new NotFoundException(
        "Account not found. Register and verify via Telegram first.",
      );
    }

    const code = generateOtp(6);
    await this.redis.setex(
      `auth:otp:${phone}`,
      OTP_TTL,
      JSON.stringify({ code, userId: user.id }),
    );

    const { ok, error } = await this.telegram.sendMessage(
      user.telegramId,
      `🔐 <b>İlanHub</b>\nВаш код входу: <code>${code}</code>\nДійсний 5 хвилин.`,
    );

    const isDev = process.env.NODE_ENV !== "production";
    const devCode = isDev && !ok ? code : undefined;
    const botUsername = await this.telegram.botUsername();

    return {
      expiresIn: OTP_TTL,
      ...(devCode ? { devCode } : {}),
      ...(!ok
        ? {
            telegramHint: `Спочатку напишіть /start боту @${botUsername}`,
            sendError: isDev ? error : undefined,
          }
        : {}),
    };
  }

  async devLogin() {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException();
    }

    const phone = normalizeAuthPhone(process.env.DEV_LOGIN_PHONE ?? "+380000000001");
    if (!phone) throw new BadRequestException("Invalid dev phone");

    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      user = await this.usersService.create({
        phone,
        name: "Dev User",
        telegramId: "dev-telegram",
      });
    } else if (!user.phoneVerifiedAt) {
      user = await this.usersService.update(user.id, {
        phoneVerifiedAt: new Date(),
        telegramId: user.telegramId ?? "dev-telegram",
        name: user.name ?? "Dev User",
      });
    }

    return this.issueToken(user);
  }

  async verifyLogin(phoneRaw: string, code: string) {
    const phone = normalizeAuthPhone(phoneRaw);
    if (!phone) throw new BadRequestException("Invalid phone number");

    const raw = await this.redis.get(`auth:otp:${phone}`);
    if (!raw) throw new UnauthorizedException("Code expired");

    const { code: expected, userId } = JSON.parse(raw) as {
      code: string;
      userId: string;
    };
    if (code !== expected) throw new UnauthorizedException("Invalid code");

    await this.redis.del(`auth:otp:${phone}`);
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException("User not found");
    return this.issueToken(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException("User not found");
    return { user: this.toPublicUser(user) };
  }

  async handleBotStart(telegramId: string, startPayload: string, firstName?: string) {
    if (startPayload.startsWith("link_")) {
      const token = startPayload.slice(5);
      const raw = await this.redis.get(`auth:link:${token}`);
      if (!raw) return { action: "expired" as const };

      await this.redis.setex(
        `auth:pending:${telegramId}`,
        LINK_TTL,
        JSON.stringify({ token }),
      );
      return { action: "request_contact" as const, token };
    }

    const user = await this.usersService.findOrCreateByTelegram(telegramId, firstName);
    if (!user.phoneVerifiedAt) {
      await this.redis.setex(
        `auth:pending:${telegramId}`,
        LINK_TTL,
        JSON.stringify({ purpose: "link" }),
      );
      return { action: "request_contact" as const };
    }
    return { action: "welcome" as const, userId: user.id };
  }

  async handleBotContact(telegramId: string, phoneRaw: string, firstName?: string) {
    const phone = normalizeAuthPhone(phoneRaw);
    if (!phone) throw new BadRequestException("Invalid phone");

    const pendingRaw = await this.redis.get(`auth:pending:${telegramId}`);
    const pending = pendingRaw
      ? (JSON.parse(pendingRaw) as { token?: string; purpose?: string })
      : null;

    if (pending?.token) {
      const linkRaw = await this.redis.get(`auth:link:${pending.token}`);
      if (!linkRaw) throw new BadRequestException("Link expired");
      const session = JSON.parse(linkRaw) as LinkSession;
      if (session.phone !== phone) {
        throw new BadRequestException("Phone does not match registration");
      }
      const user = await this.usersService.linkTelegram(
        telegramId,
        phone,
        session.name || firstName,
      );
      await this.redis.del(`auth:link:${pending.token}`);
      await this.redis.del(`auth:pending:${telegramId}`);
      return { user: this.toPublicUser(user), linked: true };
    }

    const user = await this.usersService.linkTelegram(
      telegramId,
      phone,
      firstName,
    );
    await this.redis.del(`auth:pending:${telegramId}`);
    return { user: this.toPublicUser(user), linked: true };
  }

  checkBotSecret(secret?: string) {
    const expected = process.env.BOT_INTERNAL_SECRET ?? "dev-bot-secret";
    if (secret !== expected) throw new UnauthorizedException("Invalid bot secret");
  }
}
