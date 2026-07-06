import { Inject, Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import {
  channelConfigs,
  listingMedia,
  listingPositions,
  listingVehicle,
  listings,
  payments,
  projectAddons,
  vacancyTypes,
  type Database,
} from "@ilanhub/database";
import { AUTO_SOURCE_LISTING, buildAutoTitle } from "@ilanhub/shared";
import { DRIZZLE } from "../common/constants.js";
import { UsersService } from "../users/users.service.js";
import type { CreateBotListingDto, UpdateBotListingDto } from "./dto/bot-listing.dto.js";
import type { BotListingActionDto } from "./dto/bot-listing-action.dto.js";
import type {
  BotTelegramCompleteDto,
  BotTelegramPreCheckoutDto,
} from "./dto/bot-payment.dto.js";
import { mirrorTelegramMediaList } from "./telegram-media.util.js";
import { PortmoneProvider } from "@ilanhub/payments";
import { AdminTelegramNotifyService } from "../admin/admin-telegram-notify.service.js";

function buildPaymentPayload(listingId: string, reference: string): string {
  return `lh:${listingId}:${reference}`;
}

function parsePaymentPayload(
  payload: string,
): { listingId: string; reference: string } | null {
  const match = /^lh:([0-9a-f-]{36}):([A-Za-z0-9-]+)$/.exec(payload);
  if (!match) return null;
  return { listingId: match[1]!, reference: match[2]! };
}

function uahToKopiykas(amountUah: number): number {
  return Math.round(amountUah * 100);
}

@Injectable()
export class BotsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly usersService: UsersService,
    private readonly adminNotify: AdminTelegramNotifyService,
  ) {}

  private async resolveChannelUser(dto: {
    channel: string;
    externalUserId: string;
    firstName?: string;
  }) {
    if (dto.channel === "telegram") {
      return this.usersService.findOrCreateByTelegram(
        dto.externalUserId,
        dto.firstName,
      );
    }
    if (dto.channel === "web") {
      return this.usersService.findOne(dto.externalUserId);
    }
    return this.usersService.findByChannel(dto.channel, dto.externalUserId);
  }

  async getVacancyTypes(projectId: string) {
    return this.db
      .select({
        id: vacancyTypes.id,
        name: vacancyTypes.name,
        slug: vacancyTypes.slug,
        vacancyCount: vacancyTypes.vacancyCount,
        price: vacancyTypes.price,
      })
      .from(vacancyTypes)
      .where(
        and(
          eq(vacancyTypes.projectId, projectId),
          eq(vacancyTypes.isActive, true),
        ),
      )
      .orderBy(asc(vacancyTypes.vacancyCount));
  }

  async getProjectAddons(projectId: string) {
    return this.db
      .select({
        slug: projectAddons.slug,
        name: projectAddons.name,
        price: projectAddons.price,
        billingUnit: projectAddons.billingUnit,
        isActive: projectAddons.isActive,
      })
      .from(projectAddons)
      .where(
        and(
          eq(projectAddons.projectId, projectId),
          eq(projectAddons.isActive, true),
        ),
      )
      .orderBy(asc(projectAddons.sortOrder));
  }

  async getBundlePrice(projectId: string, vacancyCount: number) {
    const [row] = await this.db
      .select({
        id: vacancyTypes.id,
        price: vacancyTypes.price,
      })
      .from(vacancyTypes)
      .where(
        and(
          eq(vacancyTypes.projectId, projectId),
          eq(vacancyTypes.vacancyCount, vacancyCount),
          eq(vacancyTypes.isActive, true),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createListing(dto: CreateBotListingDto) {
    const user = await this.resolveChannelUser(dto);

    if (!user) throw new Error("User not found");

    const positions = dto.positions ?? [];
    const isAuto = Boolean(dto.vehicle);
    const bundle = dto.listingPrice != null
      ? { id: dto.bundlePriceId ?? null, price: dto.listingPrice }
      : await this.getBundlePrice(dto.projectId, isAuto ? 1 : Math.max(positions.length, 1));
    const totalPrice = bundle?.price ?? 0;
    const title = dto.vehicle ? buildAutoTitle(dto.vehicle) : dto.title;

    const [listing] = await this.db
      .insert(listings)
      .values({
        projectId: dto.projectId,
        categoryId: dto.categoryId,
        cityId: dto.cityId,
        districtId: dto.districtId,
        userId: user.id,
        title,
        businessType: dto.businessType,
        address: dto.address,
        description: dto.description,
        contactPhone: dto.contactPhone,
        price: totalPrice,
        sourceChannel: dto.channel as
          | "telegram"
          | "viber"
          | "whatsapp"
          | "web",
        sourceStep: dto.sourceStep ?? (isAuto ? AUTO_SOURCE_LISTING : undefined),
        status: "draft",
      })
      .returning();

    if (!listing) throw new Error("Failed to create listing");

    let mediaUrls = dto.mediaUrls ?? [];
    if (
      dto.channel === "telegram" &&
      mediaUrls.some((url) => url.startsWith("tg:"))
    ) {
      const token = await this.resolveTelegramToken(dto.projectId);
      if (token) {
        mediaUrls = await mirrorTelegramMediaList(token, mediaUrls, {
          title,
          watermark: isAuto ? "auto" : "horeca",
        });
      }
    }

    if (dto.vehicle) {
      await this.db.insert(listingVehicle).values({
        listingId: listing.id,
        brand: dto.vehicle.brand,
        model: dto.vehicle.model,
        year: dto.vehicle.year,
        mileage: dto.vehicle.mileage,
        fuelType: dto.vehicle.fuelType as "petrol",
        transmission: dto.vehicle.transmission as "manual",
        driveType: dto.vehicle.driveType as "fwd" | undefined,
        engineVolume: dto.vehicle.engineVolume,
        color: dto.vehicle.color,
        condition: (dto.vehicle.condition ?? "used") as "used",
        vin: dto.vehicle.vin,
        salePrice: dto.vehicle.salePrice,
      });
    }

    if (positions.length) {
      await this.db.insert(listingPositions).values(
        positions.map((p, i) => ({
          listingId: listing.id,
          title: p.title,
          salary: p.salary,
          workingHours: p.workingHours,
          description: p.description,
          vacancyTypeId: bundle?.id ?? p.vacancyTypeId,
          sortOrder: i,
        })),
      );
    }

    if (mediaUrls.length) {
      await this.db.insert(listingMedia).values(
        mediaUrls.map((url, i) => ({
          listingId: listing.id,
          url,
          sortOrder: i,
        })),
      );
    }

    return listing;
  }

  async getListingForEdit(
    listingId: string,
    channel: string,
    externalUserId: string,
  ) {
    const user = await this.usersService.findByChannel(channel, externalUserId);
    if (!user) throw new NotFoundException("User not found");

    const listing = await this.usersService.findListingForUser(
      user.id,
      listingId,
    );
    if (!listing) throw new NotFoundException("Listing not found");

    const [row] = await this.db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!row) throw new NotFoundException("Listing not found");

    const positions = await this.db
      .select({
        title: listingPositions.title,
        salary: listingPositions.salary,
        workingHours: listingPositions.workingHours,
        description: listingPositions.description,
        vacancyTypeId: listingPositions.vacancyTypeId,
      })
      .from(listingPositions)
      .where(eq(listingPositions.listingId, listingId))
      .orderBy(asc(listingPositions.sortOrder));

    const media = await this.db
      .select({ url: listingMedia.url })
      .from(listingMedia)
      .where(eq(listingMedia.listingId, listingId))
      .orderBy(asc(listingMedia.sortOrder));

    return {
      id: row.id,
      status: row.status,
      projectId: row.projectId,
      categoryId: row.categoryId,
      cityId: row.cityId,
      districtId: row.districtId,
      businessType: row.businessType,
      title: row.title,
      address: row.address,
      description: row.description,
      contactPhone: row.contactPhone,
      price: row.price,
      sourceStep: row.sourceStep,
      positions,
      mediaUrls: media.map((m) => m.url),
    };
  }

  async updateListing(listingId: string, dto: UpdateBotListingDto) {
    const user = await this.resolveChannelUser(dto);

    if (!user) throw new NotFoundException("User not found");

    const existing = await this.usersService.findListingForUser(
      user.id,
      listingId,
    );
    if (!existing) throw new NotFoundException("Listing not found");

    const editable = [
      "draft",
      "pending_payment",
      "pending_moderation",
      "rejected",
      "approved",
    ];
    if (!editable.includes(existing.status)) {
      throw new BadRequestException("Listing cannot be edited");
    }

    const positions = dto.positions ?? [];
    const isAuto = Boolean(dto.vehicle);
    const bundle = dto.listingPrice != null
      ? { id: dto.bundlePriceId ?? null, price: dto.listingPrice }
      : await this.getBundlePrice(dto.projectId, isAuto ? 1 : Math.max(positions.length, 1));
    const totalPrice = bundle?.price ?? 0;
    const title = dto.vehicle ? buildAutoTitle(dto.vehicle) : dto.title;

    let mediaUrls = dto.mediaUrls ?? [];
    if (
      dto.channel === "telegram" &&
      mediaUrls.some((url) => url.startsWith("tg:"))
    ) {
      const token = await this.resolveTelegramToken(dto.projectId);
      if (token) {
        mediaUrls = await mirrorTelegramMediaList(token, mediaUrls, {
          title,
          watermark: isAuto ? "auto" : "horeca",
        });
      }
    }

    const [listing] = await this.db
      .update(listings)
      .set({
        projectId: dto.projectId,
        categoryId: dto.categoryId,
        cityId: dto.cityId,
        districtId: dto.districtId,
        title,
        businessType: dto.businessType,
        address: dto.address,
        description: dto.description,
        contactPhone: dto.contactPhone,
        price: totalPrice,
        sourceStep: dto.sourceStep ?? (isAuto ? AUTO_SOURCE_LISTING : undefined),
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listingId))
      .returning();

    await this.db
      .delete(listingPositions)
      .where(eq(listingPositions.listingId, listingId));
    await this.db
      .delete(listingMedia)
      .where(eq(listingMedia.listingId, listingId));
    await this.db
      .delete(listingVehicle)
      .where(eq(listingVehicle.listingId, listingId));

    if (dto.vehicle) {
      await this.db.insert(listingVehicle).values({
        listingId,
        brand: dto.vehicle.brand,
        model: dto.vehicle.model,
        year: dto.vehicle.year,
        mileage: dto.vehicle.mileage,
        fuelType: dto.vehicle.fuelType as "petrol",
        transmission: dto.vehicle.transmission as "manual",
        driveType: dto.vehicle.driveType as "fwd" | undefined,
        engineVolume: dto.vehicle.engineVolume,
        color: dto.vehicle.color,
        condition: (dto.vehicle.condition ?? "used") as "used",
        vin: dto.vehicle.vin,
        salePrice: dto.vehicle.salePrice,
      });
    }

    if (positions.length) {
      await this.db.insert(listingPositions).values(
        positions.map((p, i) => ({
          listingId,
          title: p.title,
          salary: p.salary,
          workingHours: p.workingHours,
          description: p.description,
          vacancyTypeId: bundle?.id ?? p.vacancyTypeId,
          sortOrder: i,
        })),
      );
    }

    if (mediaUrls.length) {
      await this.db.insert(listingMedia).values(
        mediaUrls.map((url, i) => ({
          listingId,
          url,
          sortOrder: i,
        })),
      );
    }

    return listing;
  }

  async prepareListingPayment(listingId: string, dto: BotListingActionDto) {
    const user = await this.usersService.findByChannel(
      dto.channel,
      dto.externalUserId,
    );
    if (!user) throw new NotFoundException("User not found");

    const listing = await this.usersService.findListingForUser(
      user.id,
      listingId,
    );
    if (!listing) throw new NotFoundException("Listing not found");

    if (listing.status !== "pending_payment") {
      throw new BadRequestException("Listing is not awaiting payment");
    }

    const amountUah = listing.price ?? 0;
    if (amountUah <= 0) {
      throw new BadRequestException("Listing has no payment due");
    }

    const [existing] = await this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.listingId, listingId),
          eq(payments.status, "pending"),
        ),
      )
      .limit(1);

    let reference: string;
    if (existing?.reference) {
      reference = existing.reference;
    } else {
      reference = `ILAN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      await this.db.insert(payments).values({
        userId: user.id,
        listingId,
        method: "portmone",
        amount: amountUah,
        currency: "UAH",
        reference,
        status: "pending",
      });
    }

    const shortId = listingId.slice(0, 8);
    const title = listing.title?.trim() || `Оголошення №${shortId}`;
    const description = `Оплата оголошення №${shortId} на İlanHub`;

    const providerToken =
      process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN?.trim() ?? "";

    let paymentUrl: string | null = null;
    const payeeId = process.env.PORTMONE_PAYEE_ID?.trim();
    const login = process.env.PORTMONE_LOGIN?.trim();
    const signatureKey = process.env.PORTMONE_SIGNATURE_KEY?.trim();
    if (payeeId && login && signatureKey) {
      try {
        const publicUrl =
          process.env.PUBLIC_URL?.trim() || "http://localhost:3010";
        const portmone = new PortmoneProvider({
          payeeId,
          login,
          signatureKey,
          password: process.env.PORTMONE_PASSWORD?.trim(),
        });
        const invoice = await portmone.createPayment({
          amount: amountUah,
          currency: "UAH",
          reference,
          description,
          userId: user.id,
          listingId,
          callbackUrl: `${publicUrl}/api/payments/webhooks/portmone`,
          redirectUrl: `${publicUrl}/account/listings`,
        });
        paymentUrl = invoice.paymentUrl;
      } catch {
        paymentUrl = null;
      }
    }

    return {
      listingId,
      reference,
      payload: buildPaymentPayload(listingId, reference),
      amountUah,
      amountKopiykas: uahToKopiykas(amountUah),
      currency: "UAH",
      title,
      description,
      label: `Оголошення №${shortId}`,
      providerToken,
      paymentUrl,
    };
  }

  async validateTelegramPreCheckout(dto: BotTelegramPreCheckoutDto) {
    const parsed = parsePaymentPayload(dto.payload);
    if (!parsed) return { ok: false, error: "Invalid payload" };

    const user = await this.usersService.findByChannel(
      dto.channel,
      dto.externalUserId,
    );
    if (!user) return { ok: false, error: "User not found" };

    const listing = await this.usersService.findListingForUser(
      user.id,
      parsed.listingId,
    );
    if (!listing || listing.status !== "pending_payment") {
      return { ok: false, error: "Listing not payable" };
    }

    const expected = uahToKopiykas(listing.price ?? 0);
    if (dto.totalAmount !== expected) {
      return { ok: false, error: "Amount mismatch" };
    }

    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.reference, parsed.reference))
      .limit(1);

    if (!payment || payment.listingId !== parsed.listingId) {
      return { ok: false, error: "Payment not found" };
    }

    return { ok: true };
  }

  async completeTelegramPayment(dto: BotTelegramCompleteDto) {
    const parsed = parsePaymentPayload(dto.payload);
    if (!parsed) throw new BadRequestException("Invalid payload");

    const user = await this.usersService.findByChannel(
      dto.channel,
      dto.externalUserId,
    );
    if (!user) throw new NotFoundException("User not found");

    const listing = await this.usersService.findListingForUser(
      user.id,
      parsed.listingId,
    );
    if (!listing) throw new NotFoundException("Listing not found");

    const expected = uahToKopiykas(listing.price ?? 0);
    if (dto.totalAmount !== expected) {
      throw new BadRequestException("Amount mismatch");
    }

    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.reference, parsed.reference))
      .limit(1);

    if (!payment || payment.listingId !== parsed.listingId) {
      throw new NotFoundException("Payment not found");
    }

    if (payment.status === "completed") {
      return {
        listingId: parsed.listingId,
        status: listing.status,
        alreadyPaid: true,
      };
    }

    await this.db
      .update(payments)
      .set({
        status: "completed",
        externalId: dto.telegramPaymentChargeId,
        paidAt: new Date(),
        metadata: {
          providerPaymentChargeId: dto.providerPaymentChargeId,
          currency: dto.currency,
          totalAmount: dto.totalAmount,
        },
      })
      .where(eq(payments.id, payment.id));

    const [updated] = await this.db
      .update(listings)
      .set({ status: "pending_moderation", updatedAt: new Date() })
      .where(eq(listings.id, parsed.listingId))
      .returning();

    if (updated) {
      void this.adminNotify.notifyListingEvent(
        parsed.listingId,
        "payment_received",
      );
    }

    return {
      listingId: parsed.listingId,
      status: updated?.status ?? "pending_moderation",
      alreadyPaid: false,
    };
  }

  async resubmitUserListing(listingId: string, dto: BotListingActionDto) {
    const user = await this.usersService.findByChannel(
      dto.channel,
      dto.externalUserId,
    );
    if (!user) throw new NotFoundException("User not found");

    const listing = await this.usersService.findListingForUser(
      user.id,
      listingId,
    );
    if (!listing) throw new NotFoundException("Listing not found");

    const canResubmit = [
      "published",
      "expired",
      "rejected",
      "approved",
    ].includes(listing.status);
    if (!canResubmit) {
      throw new BadRequestException("Listing cannot be resubmitted");
    }

    const [row] = await this.db
      .update(listings)
      .set({ status: "pending_moderation", updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning();

    if (row) {
      void this.adminNotify.notifyListingEvent(listingId, "resubmitted");
    }

    return { data: row };
  }

  private async resolveTelegramToken(projectId: string): Promise<string | null> {
    const rows = await this.db
      .select()
      .from(channelConfigs)
      .where(
        and(
          eq(channelConfigs.projectId, projectId),
          eq(channelConfigs.channel, "telegram"),
          eq(channelConfigs.purpose, "listing_input"),
        ),
      );

    const row =
      rows.find((r) => r.isActive) ??
      rows.find((r) =>
        Boolean((r.config as Record<string, unknown>).botToken),
      );

    const fromDb = row
      ? String((row.config as Record<string, unknown>).botToken ?? "")
      : "";
    const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
    return fromDb || fromEnv || null;
  }
}
