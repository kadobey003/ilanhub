import type { Context } from "grammy";
import { i18n } from "@ilanhub/i18n";
import type { ApiListing } from "@ilanhub/shared";
import { formatAmountUah, formatHorecaPostHtml, parseStoredPosition } from "@ilanhub/shared";
import { api } from "./api.js";
import { replyOrEditText } from "./messaging.js";
import { listingActionsKeyboard, listingPreviewKeyboard, myListingsKeyboard, paymentPendingKeyboard } from "./keyboards.js";
import { parseDescriptionMeta, startEditExistingListing } from "./horeca-flow.js";
import { sendListingPaymentInvoice } from "./payments.js";

const SITE_URL = process.env.PUBLIC_URL ?? "https://ilanhub.com";

const STATUS_LABELS = i18n.bot.myListingsStatus as Record<string, string>;

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function formatPrice(price: number | null, currency?: string | null): string {
  if (price == null) return "—";
  if ((currency === "UAH" || !currency) && price <= 0) {
    return formatAmountUah(0);
  }
  const cur = currency === "UAH" || !currency ? "₴" : currency;
  return `${price.toLocaleString("uk-UA")} ${cur}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function listingDetailText(listing: ApiListing): string {
  const lines = [
    `📄 <b>${listing.title ?? "Без назви"}</b>`,
    `📊 ${statusLabel(listing.status)}`,
    listing.project ? `📁 ${listing.project}` : "",
    `💰 ${formatPrice(listing.price, listing.currency)}`,
    `📅 ${formatDate(listing.createdAt)}`,
  ];
  if (listing.publishedAt) {
    lines.push(`✅ Опубліковано ${formatDate(listing.publishedAt)}`);
  }
  return lines.filter(Boolean).join("\n");
}

async function showPublishedListingPreview(
  ctx: Context,
  userId: string,
  listing: ApiListing,
): Promise<void> {
  const { data } = await api.getBotListing(listing.id, userId);
  const meta = parseDescriptionMeta(data.description);
  const positions = data.positions.map((p) => {
    const parsed = parseStoredPosition(p);
    return {
      title: parsed.title,
      experience: parsed.experience ?? undefined,
      salary: parsed.salary ?? undefined,
      schedule: parsed.schedule ?? undefined,
      workTime: parsed.workTime ?? undefined,
      description: parsed.description ?? undefined,
    };
  });

  const postHtml = formatHorecaPostHtml({
    businessType: data.businessType ?? undefined,
    title: data.title,
    address: data.address ?? undefined,
    benefits: meta.benefits,
    contactPhone: data.contactPhone ?? undefined,
    positions,
    siteUrl: `${SITE_URL}/${listing.projectSlug ?? "horeca"}/listing/${listing.id}`,
  });

  const markup = listingPreviewKeyboard(listing);
  const photoRef = data.mediaUrls[0];
  if (photoRef) {
    const photo = photoRef.startsWith("tg:") ? photoRef.slice(3) : photoRef;
    if (postHtml.length <= 1020) {
      await ctx.replyWithPhoto(photo, {
        caption: postHtml,
        parse_mode: "HTML",
        reply_markup: markup,
      });
    } else {
      await ctx.replyWithPhoto(photo, { caption: i18n.bot.horeca.preview });
      await ctx.reply(postHtml, { parse_mode: "HTML", reply_markup: markup });
    }
    return;
  }
  await ctx.reply(postHtml, { parse_mode: "HTML", reply_markup: markup });
}

export async function showMyListingsMenu(
  ctx: Context,
  userId: string,
): Promise<void> {
  const { data } = await api.getUserListings("telegram", userId);
  if (!data.length) {
    await ctx.reply(i18n.bot.myListingsEmpty);
    return;
  }

  const text = `${i18n.bot.myListings}\n\n${i18n.bot.myListingsChoose}`;
  const markup = myListingsKeyboard(data);
  await replyOrEditText(ctx, text, { reply_markup: markup });
}

export async function showMyListingDetail(
  ctx: Context,
  userId: string,
  listingId: string,
): Promise<void> {
  const { data: listings } = await api.getUserListings("telegram", userId);
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) {
    await ctx.answerCallbackQuery({ text: i18n.bot.error, show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(listingDetailText(listing), {
    parse_mode: "HTML",
    reply_markup: listingActionsKeyboard(listing),
  });
}

export async function handleMyListingAction(
  ctx: Context,
  userId: string,
  action: string,
  listingId: string,
): Promise<void> {
  const { data: listings } = await api.getUserListings("telegram", userId);
  const listing = listings.find((l) => l.id === listingId);
  if (!listing) {
    await ctx.answerCallbackQuery({ text: i18n.bot.error, show_alert: true });
    return;
  }

  if (action === "view") {
    await ctx.answerCallbackQuery();
    try {
      await showPublishedListingPreview(ctx, userId, listing);
    } catch {
      await ctx.reply(i18n.bot.error);
    }
    return;
  }

  if (action === "edit") {
    await ctx.answerCallbackQuery();
    await startEditExistingListing(ctx, userId, listing.id);
    return;
  }

  if (action === "resubmit") {
    try {
      await api.resubmitListing(listing.id, userId);
      await ctx.answerCallbackQuery({ text: i18n.bot.myListingsResubmitOk });
      await showMyListingsMenu(ctx, userId);
    } catch {
      await ctx.answerCallbackQuery({ text: i18n.bot.error, show_alert: true });
    }
    return;
  }

  if (action === "payment") {
    await ctx.answerCallbackQuery();
    const payResult = await sendListingPaymentInvoice(ctx, listing.id, userId);
    if (!payResult.ok) {
      await ctx.reply(
        payResult.paymentUrl
          ? i18n.bot.paymentRetryHint
          : i18n.bot.paymentNotConfigured,
        {
          reply_markup: paymentPendingKeyboard(
            listing.id,
            payResult.paymentUrl,
          ),
        },
      );
    }
    return;
  }
}
