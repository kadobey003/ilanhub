import type { Context } from "grammy";

import { i18n, t } from "@ilanhub/i18n";

import { formatAmountUah } from "@ilanhub/shared";

import { api } from "./api.js";

import { paymentPendingKeyboard, submittedListingKeyboard } from "./keyboards.js";
import { mainMenuKeyboard } from "./bot-menu.js";



let cachedProviderToken: string | null | undefined;



export type PaymentSendResult =

  | { ok: true; method: "invoice" | "link" }

  | { ok: false; paymentUrl?: string | null };



async function resolveProviderToken(): Promise<string | null> {

  if (cachedProviderToken !== undefined) return cachedProviderToken;

  const env = process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN?.trim();

  if (env) {

    cachedProviderToken = env;

    return env;

  }

  try {

    const res = await fetch(

      `${process.env.API_URL ?? "http://localhost:3010"}/api/bots/telegram/config`,

      {

        headers: {

          "x-bot-secret": process.env.BOT_INTERNAL_SECRET ?? "dev-bot-secret",

        },

      },

    );

    const data = (await res.json()) as { paymentProviderToken?: string | null };

    cachedProviderToken = data.paymentProviderToken?.trim() || null;

  } catch {

    cachedProviderToken = null;

  }

  return cachedProviderToken;

}



export async function sendListingPaymentInvoice(

  ctx: Context,

  listingId: string,

  userId: string,

): Promise<PaymentSendResult> {

  let data: Awaited<ReturnType<typeof api.prepareBotPayment>>["data"];

  try {

    ({ data } = await api.prepareBotPayment(listingId, userId));

  } catch (err) {

    console.error("prepareBotPayment failed:", err);

    return { ok: false };

  }



  const shortId = listingId.slice(0, 8);

  const providerToken =

    (await resolveProviderToken()) ?? data.providerToken?.trim();



  if (providerToken) {

    try {

      await ctx.reply(t("bot.paymentInvoiceIntro", { id: shortId }));

      await ctx.replyWithInvoice(

        data.title,

        data.description,

        data.payload,

        data.currency,

        [{ label: data.label, amount: data.amountKopiykas }],

        {

          provider_token: providerToken,

          need_name: false,

          need_phone_number: false,

          need_email: false,

          need_shipping_address: false,

          is_flexible: false,

        },

      );

      return { ok: true, method: "invoice" };

    } catch (err) {

      console.error("replyWithInvoice failed:", err);

    }

  }



  if (data.paymentUrl) {

    await ctx.reply(

      t("bot.paymentLinkIntro", {

        id: shortId,

        amount: formatAmountUah(data.amountUah),

      }),

      { reply_markup: paymentPendingKeyboard(listingId, data.paymentUrl) },

    );

    return { ok: true, method: "link" };

  }



  return { ok: false, paymentUrl: data.paymentUrl ?? null };

}



export async function handlePreCheckoutQuery(ctx: Context): Promise<void> {

  const query = ctx.preCheckoutQuery;

  if (!query) return;



  const userId = String(query.from.id);

  try {

    const { ok, error } = await api.validateTelegramPreCheckout({

      channel: "telegram",

      externalUserId: userId,

      payload: query.invoice_payload,

      totalAmount: query.total_amount,

    });

    if (ok) {

      await ctx.answerPreCheckoutQuery(true);

      return;

    }

    await ctx.answerPreCheckoutQuery(false, {

      error_message: error ?? i18n.bot.paymentFailed,

    });

  } catch (err) {

    console.error("pre_checkout_query failed:", err);

    await ctx.answerPreCheckoutQuery(false, {

      error_message: i18n.bot.paymentFailed,

    });

  }

}



export async function handleSuccessfulPayment(ctx: Context): Promise<void> {

  const payment = ctx.message?.successful_payment;

  const userId = String(ctx.from?.id ?? "");

  if (!payment) return;



  try {

    const { data } = await api.completeTelegramPayment({

      channel: "telegram",

      externalUserId: userId,

      payload: payment.invoice_payload,

      currency: payment.currency,

      totalAmount: payment.total_amount,

      telegramPaymentChargeId: payment.telegram_payment_charge_id,

      providerPaymentChargeId: payment.provider_payment_charge_id,

    });



    const shortId = data.listingId.slice(0, 8);

    const msg = data.alreadyPaid

      ? t("bot.paymentAlreadyDone", { id: shortId })

      : t("bot.paymentSuccess", { id: shortId });



    await ctx.reply(msg, {

      reply_markup: submittedListingKeyboard(data.listingId),

    });

  } catch (err) {

    console.error("successful_payment failed:", err);

    await ctx.reply(i18n.bot.paymentFailed, {

      reply_markup: await mainMenuKeyboard(),

    });

  }

}



export function invalidatePaymentProviderCache(): void {

  cachedProviderToken = undefined;

}


