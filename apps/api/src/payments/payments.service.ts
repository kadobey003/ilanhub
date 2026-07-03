import { Inject, Injectable } from "@nestjs/common";

import { eq } from "drizzle-orm";

import { listings, payments, type Database } from "@ilanhub/database";

import { PortmoneProvider } from "@ilanhub/payments";

import { DRIZZLE } from "../common/constants.js";

import { AdminTelegramNotifyService } from "../admin/admin-telegram-notify.service.js";

import type { CreatePaymentDto } from "./dto/payment.dto.js";



@Injectable()

export class PaymentsService {

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly adminNotify: AdminTelegramNotifyService,
  ) {}



  private portmoneProvider(): PortmoneProvider | null {

    const payeeId = process.env.PORTMONE_PAYEE_ID?.trim();

    const login = process.env.PORTMONE_LOGIN?.trim();

    const signatureKey = process.env.PORTMONE_SIGNATURE_KEY?.trim();

    if (!payeeId || !login || !signatureKey) return null;

    return new PortmoneProvider({

      payeeId,

      login,

      password: process.env.PORTMONE_PASSWORD?.trim(),

      signatureKey,

    });

  }



  async create(dto: CreatePaymentDto) {

    const reference = `ILAN-${crypto.randomUUID().slice(0, 8)}`;

    const [row] = await this.db

      .insert(payments)

      .values({

        userId: dto.userId,

        listingId: dto.listingId,

        method: dto.method,

        amount: dto.amount,

        reference,

        status: "pending",

      })

      .returning();



    let checkoutUrl: string | null = null;

    if (dto.method === "monopay") {

      checkoutUrl = `https://api.monobank.ua/checkout?ref=${reference}`;

    } else if (dto.method === "portmone") {

      const provider = this.portmoneProvider();

      if (provider) {

        const publicUrl =

          process.env.PUBLIC_URL?.trim() || "http://localhost:3010";

        const invoice = await provider.createPayment({

          amount: dto.amount,

          currency: "UAH",

          reference,

          description: `Оплата оголошення ${reference}`,

          userId: dto.userId,

          listingId: dto.listingId,

          callbackUrl: `${publicUrl}/api/payments/webhooks/portmone`,

          redirectUrl: `${publicUrl}/account/listings`,

        });

        checkoutUrl = invoice.paymentUrl;

      }

    }



    return {

      payment: row,

      checkoutUrl,

      bankDetails:

        dto.method === "bank_transfer"

          ? {

              iban: process.env.BANK_TRANSFER_IBAN,

              recipient: process.env.BANK_TRANSFER_RECIPIENT,

              reference,

            }

          : null,

    };

  }



  async handleMonopayWebhook(

    body: Record<string, unknown>,

    _headers: Record<string, unknown>,

  ) {

    const reference = String(body.reference ?? "");

    if (!reference) return { ok: false };



    const [row] = await this.db

      .update(payments)

      .set({

        status: "completed",

        externalId: String(body.invoiceId ?? ""),

        paidAt: new Date(),

      })

      .where(eq(payments.reference, reference))

      .returning();



    if (row?.listingId) {

      await this.db

        .update(listings)

        .set({ status: "pending_moderation", updatedAt: new Date() })

        .where(eq(listings.id, row.listingId));

      void this.adminNotify.notifyListingEvent(row.listingId, "payment_received");

    }



    return { ok: true };

  }



  async handlePortmoneWebhook(

    body: Record<string, unknown>,

    _headers: Record<string, unknown>,

  ) {

    const reference = String(

      body.shop_order_number ??

        body.shopOrderNumber ??

        body.SHOPORDERNUMBER ??

        body.order_id ??

        body.reference ??

        "",

    );

    const status = String(body.status ?? body.STATUS ?? body.result ?? "").toUpperCase();

    if (!reference) return { ok: false };

    if (status && status !== "PAYED" && status !== "SUCCESS") {

      return { ok: true, ignored: true };

    }



    const [row] = await this.db

      .update(payments)

      .set({

        status: "completed",

        externalId: String(

          body.shop_bill_id ?? body.shopBillId ?? body.SHOPBILLID ?? "",

        ),

        paidAt: new Date(),

        metadata: body,

      })

      .where(eq(payments.reference, reference))

      .returning();



    if (row?.listingId) {

      await this.db

        .update(listings)

        .set({ status: "pending_moderation", updatedAt: new Date() })

        .where(eq(listings.id, row.listingId));

      void this.adminNotify.notifyListingEvent(row.listingId, "payment_received");

    }



    return { ok: true };

  }

}


