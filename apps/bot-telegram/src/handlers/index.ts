import type { Bot, Context } from "grammy";
import { i18n, t } from "@ilanhub/i18n";
import { api } from "../api.js";
import {
  HORECA_SLUG,
  handleHorecaCity,
  handleHorecaPhoto,
  handleHorecaText,
  handleHorecaVacancyCount,
  handleHorecaContact,
  handleHorecaEdit,
  handleVacancyDescriptionSkip,
  handlePinChoice,
  returnAfterEdit,
  handleScheduleSkip,
  handleDailyChoice,
  promptDailyDuplicate,
  resumeHoreca,
  showEditMenu,
  showListingChannelPreview,
  saveAndRepublishListing,
  showHorecaPreview,
  startNewHorecaListing,
  submitHorecaListing,
} from "../horeca-flow.js";
import { HorecaStep } from "@ilanhub/shared";
import {
  contactKeyboard,
  horecaContactKeyboard,
  mainMenuKeyboard,
  paymentPendingKeyboard,
  submittedListingKeyboard,
} from "../keyboards.js";
import {
  clearSession,
  createSession,
  getSession,
  saveSession,
} from "../session.js";
import {
  handleMyListingAction,
  showMyListingDetail,
  showMyListingsMenu,
} from "../my-listings.js";
import {
  handlePreCheckoutQuery,
  handleSuccessfulPayment,
  sendListingPaymentInvoice,
} from "../payments.js";
import { showWelcome } from "../welcome.js";
import { registerAdminHandlers } from "../admin-handlers.js";

const CHANNEL = "telegram" as const;
const SITE_URL = process.env.PUBLIC_URL ?? "https://ilanhub.com";

export function registerHandlers(bot: Bot): void {
  bot.catch((err) => {
    console.error("bot handler error:", err.message);
  });
  bot.command("start", handleStart);
  bot.command("continue", handleContinue);
  registerAdminHandlers(bot);
  bot.callbackQuery(/^action:/, handleAction);
  bot.callbackQuery(/^project:/, handleProjectSelect);
  bot.callbackQuery(/^category:/, handleCategorySelect);
  bot.callbackQuery(/^city:/, handleCitySelect);
  bot.callbackQuery(/^vacancy_count:/, handleVacancyCountSelect);
  bot.callbackQuery(/^my_act:/, handleMyListingActionCallback);
  bot.callbackQuery(/^my:/, handleMyListingSelect);
  bot.callbackQuery(/^edit:/, handleEdit);
  bot.on("message:text", handleText);
  bot.on("message:photo", handlePhoto);
  bot.on("message:contact", handleContact);
  bot.on("pre_checkout_query", handlePreCheckoutQuery);
  bot.on("message:successful_payment", handleSuccessfulPayment);
}

async function handleStart(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const payload = ctx.match as string | undefined;
  const startPayload = payload && payload !== "" ? payload : "menu";

  try {
    const result = await api.botStart(
      userId,
      startPayload,
      ctx.from?.first_name,
    );

    if (result.action === "expired") {
      await ctx.reply(i18n.bot.authLinkExpired, { reply_markup: mainMenuKeyboard() });
      return;
    }
    if (result.action === "request_contact") {
      await ctx.reply(i18n.bot.authRequestPhone, {
        reply_markup: contactKeyboard(),
      });
      return;
    }
  } catch {
    // fall through
  }

  await clearSession(CHANNEL, userId);
  await showWelcome(ctx, mainMenuKeyboard());
}

async function handleContinue(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) {
    await ctx.reply(i18n.bot.noSession);
    return;
  }
  if (session.flow === "horeca") {
    await resumeHoreca(ctx, session);
    return;
  }
  await ctx.reply(i18n.bot.noSession);
}

async function handleAction(ctx: Context): Promise<void> {
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // stale callback
  }
  const action = ctx.callbackQuery?.data?.replace("action:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");

  if (action === "new") {
    try {
      const session = createSession(userId, CHANNEL);
      await saveSession(session);
      await startNewHorecaListing(ctx, session);
    } catch (err) {
      console.error("action:new failed:", err);
      await ctx.reply(i18n.bot.error);
    }
    return;
  }
  if (action === "cancel") {
    await clearSession(CHANNEL, userId);
    const msg = ctx.callbackQuery?.message;
    if (msg) {
      await showWelcome(ctx, mainMenuKeyboard(), { edit: true });
    } else {
      await showWelcome(ctx, mainMenuKeyboard());
    }
    return;
  }
  if (action === "photos_done") {
    return;
  }
  if (action === "pin_yes") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handlePinChoice(ctx, session, true);
    return;
  }
  if (action === "pin_no") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handlePinChoice(ctx, session, false);
    return;
  }
  if (action === "schedule_skip") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleScheduleSkip(ctx, session);
    return;
  }
  if (action === "vacancy_desc_skip") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleVacancyDescriptionSkip(ctx, session);
    return;
  }
  if (action === "daily_yes") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleDailyChoice(ctx, session, true);
    return;
  }
  if (action === "daily_no") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleDailyChoice(ctx, session, false);
    return;
  }
  if (action === "benefits_skip") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca" && session.horecaStep === HorecaStep.BENEFITS) {
      session.benefits = undefined;
      if (session.listingId && session.editTarget === "benefits") {
        await returnAfterEdit(ctx, session);
      } else {
        session.horecaStep = HorecaStep.CONTACT;
        await saveSession(session);
        await ctx.reply(i18n.bot.horeca.contact, {
          reply_markup: horecaContactKeyboard(),
        });
      }
    }
    return;
  }
  if (action === "edit_menu") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await showEditMenu(ctx, session);
    return;
  }
  if (action === "preview") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") {
      if (session.listingId) {
        await showListingChannelPreview(ctx, session);
      } else {
        await showHorecaPreview(ctx, session);
      }
    }
    return;
  }
  if (action === "save_republish") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca" && session.listingId) {
      try {
        await saveAndRepublishListing(ctx, session, userId);
      } catch (err) {
        console.error("saveAndRepublishListing failed:", err);
        await ctx.reply(i18n.bot.error);
      }
    }
    return;
  }
  if (action === "preview_back") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") {
      session.horecaStep = HorecaStep.DAILY_DUPLICATE;
      await saveSession(session);
      await promptDailyDuplicate(ctx, session);
    }
    return;
  }
  if (action === "confirm") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca" && session.horecaStep) {
      try {
        const result = await submitHorecaListing(
          session,
          userId,
          ctx.from?.first_name,
        );
        await clearSession(CHANNEL, userId);
        const shortId = result.id.slice(0, 8);
        try {
          await ctx.deleteMessage();
        } catch {
          // preview may be text or photo
        }

        if (result.price > 0 && result.status === "pending_payment") {
          const payResult = await sendListingPaymentInvoice(
            ctx,
            result.id,
            userId,
          );
          if (!payResult.ok) {
            await ctx.reply(t("bot.paymentInvoiceIntro", { id: shortId }));
            await ctx.reply(
              payResult.paymentUrl
                ? i18n.bot.paymentRetryHint
                : i18n.bot.paymentNotConfigured,
              {
                reply_markup: paymentPendingKeyboard(
                  result.id,
                  payResult.paymentUrl,
                ),
              },
            );
          }
          return;
        }

        let msg: string;
        if (result.updated) {
          msg = t("bot.listingUpdated", { id: shortId });
        } else {
          msg = i18n.bot.listing_submitted.replace("{{id}}", shortId);
        }
        await ctx.reply(msg, {
          reply_markup: submittedListingKeyboard(result.id),
        });
      } catch (err) {
        console.error("submitHorecaListing failed:", err);
        await ctx.reply(i18n.bot.error);
      }
    }
    return;
  }
  if (action === "my") {
    try {
      await ctx.answerCallbackQuery();
      await showMyListingsMenu(ctx, userId);
    } catch (err) {
      console.error("showMyListingsMenu failed:", err);
      await ctx.reply(i18n.bot.error);
    }
    return;
  }
  if (action === "menu") {
    await ctx.answerCallbackQuery();
    const msg = ctx.callbackQuery?.message;
    if (msg) {
      await showWelcome(ctx, mainMenuKeyboard(), { edit: true });
    } else {
      await showWelcome(ctx, mainMenuKeyboard());
    }
    return;
  }
  if (action === "support") {
    await ctx.reply(i18n.bot.supportMessage);
    return;
  }
  if (action === "site") {
    await ctx.reply(`🌐 ${SITE_URL}`);
    return;
  }
}

async function handleMyListingSelect(ctx: Context): Promise<void> {
  const listingId = ctx.callbackQuery?.data?.replace("my:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");
  if (!listingId) return;
  await showMyListingDetail(ctx, userId, listingId);
}

async function handleMyListingActionCallback(ctx: Context): Promise<void> {
  const raw = ctx.callbackQuery?.data?.replace("my_act:", "") ?? "";
  const [action, listingId] = raw.split(":");
  const userId = String(ctx.from?.id ?? "");
  if (!action || !listingId) return;
  await handleMyListingAction(ctx, userId, action, listingId);
}

async function handleProjectSelect(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const raw = ctx.callbackQuery?.data?.replace("project:", "") ?? "";
  const [projectId, slug] = raw.split(":");
  const userId = String(ctx.from?.id ?? "");

  if (slug !== HORECA_SLUG) {
    await ctx.editMessageText(i18n.bot.categoryComingSoon, {
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }

  const session = (await getSession(CHANNEL, userId)) ?? createSession(userId, CHANNEL);
  session.projectId = projectId;
  await saveSession(session);
  await startNewHorecaListing(ctx, session);
}

async function handleCategorySelect(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  await startNewHorecaListing(ctx, session);
}

async function handleCitySelect(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const cityId = ctx.callbackQuery?.data?.replace("city:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session || session.flow !== "horeca") return;
  await handleHorecaCity(ctx, session, cityId);
}

async function handleVacancyCountSelect(ctx: Context): Promise<void> {
  const count = Number(ctx.callbackQuery?.data?.replace("vacancy_count:", "") ?? "0");
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session || session.flow !== "horeca" || count < 1 || count > 3) return;
  await handleHorecaVacancyCount(ctx, session, count);
}

async function handlePhoto(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session || session.flow !== "horeca") return;
  await handleHorecaPhoto(ctx, session);
}

async function handleText(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  const text = ctx.message?.text ?? "";

  if (session.flow === "horeca" && session.horecaStep) {
    await handleHorecaText(ctx, session, text);
  }
}

async function handleEdit(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const target = ctx.callbackQuery?.data?.replace("edit:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session || session.flow !== "horeca") return;
  await handleHorecaEdit(ctx, session, target);
}

async function handleContact(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const contact = ctx.message?.contact;
  if (!contact?.phone_number) return;

  const session = await getSession(CHANNEL, userId);
  if (session?.flow === "horeca" && session.horecaStep === HorecaStep.CONTACT) {
    await handleHorecaContact(ctx, session, contact.phone_number);
    return;
  }

  try {
    await api.botContact(userId, contact.phone_number, ctx.from?.first_name);
    await ctx.reply(i18n.bot.authPhoneLinked, {
      reply_markup: { remove_keyboard: true },
    });
    await showWelcome(ctx, mainMenuKeyboard());
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not match")) {
      await ctx.reply(i18n.bot.authPhoneMismatch);
    } else {
      await ctx.reply(i18n.bot.error);
    }
  }
}
