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
  handleVacancyDescriptionSkip as handleHorecaVacancyDescriptionSkip,
  handlePinChoice as handleHorecaPinChoice,
  returnAfterEdit as horecaReturnAfterEdit,
  handleScheduleSkip as handleHorecaScheduleSkip,
  handleDailyChoice as handleHorecaDailyChoice,
  promptDailyDuplicate as horecaPromptDailyDuplicate,
  resumeHoreca,
  showEditMenu as showHorecaEditMenu,
  showListingChannelPreview as showHorecaChannelPreview,
  saveAndRepublishListing as saveAndRepublishHorecaListing,
  showHorecaPreview,
  startNewHorecaListing,
  submitHorecaListing,
} from "../horeca-flow.js";
import {
  JOBS_SLUG,
  handleJobsCity,
  handleJobsPhoto,
  handleJobsText,
  handleJobsVacancyCount,
  handleJobsContact,
  handleJobsEdit,
  handleVacancyDescriptionSkip as handleJobsVacancyDescriptionSkip,
  handlePinChoice as handleJobsPinChoice,
  returnAfterEdit as jobsReturnAfterEdit,
  handleScheduleSkip as handleJobsScheduleSkip,
  handleDailyChoice as handleJobsDailyChoice,
  promptDailyDuplicate as jobsPromptDailyDuplicate,
  resumeJobs,
  showEditMenu as showJobsEditMenu,
  showListingChannelPreview as showJobsChannelPreview,
  saveAndRepublishListing as saveAndRepublishJobsListing,
  showJobsPreview,
  startNewJobsListing,
  submitJobsListing,
} from "../jobs-flow.js";
import {
  handleBrowseJobsCity,
  startBrowseJobs,
} from "../browse-jobs-flow.js";
import { HorecaStep } from "@ilanhub/shared";
import {
  contactKeyboard,
  horecaContactKeyboard,
  jobsModeKeyboard,
  paymentPendingKeyboard,
  projectKeyboard,
  submittedListingKeyboard,
} from "../keyboards.js";
import { getBotMenu, mainMenuKeyboard, replyChannelsList } from "../bot-menu.js";
import { replyOrEditText } from "../messaging.js";
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
import { touchIdleFromSession } from "../idle-timeout.js";

const CHANNEL = "telegram" as const;

type VacancyFlow = "horeca" | "jobs";

function isVacancyFlow(flow?: string): flow is VacancyFlow {
  return flow === "horeca" || flow === "jobs";
}

async function promptProjectSelection(ctx: Context): Promise<void> {
  const { data: projects } = await api.getProjects();
  if (!projects.length) {
    await ctx.reply(i18n.bot.error);
    return;
  }
  await replyOrEditText(ctx, i18n.bot.selectProject, {
    reply_markup: projectKeyboard(projects),
  });
}

export function registerHandlers(bot: Bot): void {
  bot.use(async (ctx, next) => {
    await next();
    const userId = String(ctx.from?.id ?? "");
    const chatId = ctx.chat?.id;
    if (!userId || chatId === undefined) return;
    try {
      const session = await getSession(CHANNEL, userId);
      await touchIdleFromSession(bot, userId, chatId, session);
    } catch (err) {
      console.warn("idle touch failed:", err);
    }
  });
  bot.catch((err) => {
    console.error("bot handler error:", err.message);
  });
  bot.command("start", handleStart);
  bot.command("continue", handleContinue);
  registerAdminHandlers(bot);
  bot.callbackQuery(/^browse_city:/, handleBrowseCitySelect);
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
      await ctx.reply(i18n.bot.authLinkExpired, { reply_markup: await mainMenuKeyboard() });
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
  await showWelcome(ctx, await mainMenuKeyboard());
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
  if (session.flow === "jobs") {
    await resumeJobs(ctx, session);
    return;
  }
  if (session.flow === "browse_jobs") {
    await startBrowseJobs(ctx, session);
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
      await promptProjectSelection(ctx);
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
      await showWelcome(ctx, await mainMenuKeyboard(), { edit: true });
    } else {
      await showWelcome(ctx, await mainMenuKeyboard());
    }
    return;
  }
  if (action === "photos_done") {
    return;
  }
  if (action === "browse_jobs") {
    const session = (await getSession(CHANNEL, userId)) ?? createSession(userId, CHANNEL);
    await startBrowseJobs(ctx, session);
    return;
  }
  if (action === "jobs_post") {
    const session = await getSession(CHANNEL, userId);
    if (session) await startNewJobsListing(ctx, session);
    return;
  }
  if (action === "pin_yes") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleHorecaPinChoice(ctx, session, true);
    else if (session?.flow === "jobs") await handleJobsPinChoice(ctx, session, true);
    return;
  }
  if (action === "pin_no") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleHorecaPinChoice(ctx, session, false);
    else if (session?.flow === "jobs") await handleJobsPinChoice(ctx, session, false);
    return;
  }
  if (action === "schedule_skip") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleHorecaScheduleSkip(ctx, session);
    else if (session?.flow === "jobs") await handleJobsScheduleSkip(ctx, session);
    return;
  }
  if (action === "vacancy_desc_skip") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleHorecaVacancyDescriptionSkip(ctx, session);
    else if (session?.flow === "jobs") await handleJobsVacancyDescriptionSkip(ctx, session);
    return;
  }
  if (action === "daily_yes") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleHorecaDailyChoice(ctx, session, true);
    else if (session?.flow === "jobs") await handleJobsDailyChoice(ctx, session, true);
    return;
  }
  if (action === "daily_no") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await handleHorecaDailyChoice(ctx, session, false);
    else if (session?.flow === "jobs") await handleJobsDailyChoice(ctx, session, false);
    return;
  }
  if (action === "benefits_skip") {
    const session = await getSession(CHANNEL, userId);
    if (isVacancyFlow(session?.flow) && session.horecaStep === HorecaStep.BENEFITS) {
      session.benefits = undefined;
      if (session.listingId && session.editTarget === "benefits") {
        if (session.flow === "horeca") await horecaReturnAfterEdit(ctx, session);
        else await jobsReturnAfterEdit(ctx, session);
      } else {
        session.horecaStep = HorecaStep.CONTACT;
        await saveSession(session);
        const contactMsg =
          session.flow === "horeca" ? i18n.bot.horeca.contact : i18n.bot.jobs.contact;
        await ctx.reply(contactMsg, { reply_markup: horecaContactKeyboard() });
      }
    }
    return;
  }
  if (action === "edit_menu") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") await showHorecaEditMenu(ctx, session);
    else if (session?.flow === "jobs") await showJobsEditMenu(ctx, session);
    return;
  }
  if (action === "preview") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca") {
      if (session.listingId) await showHorecaChannelPreview(ctx, session);
      else await showHorecaPreview(ctx, session);
    } else if (session?.flow === "jobs") {
      if (session.listingId) await showJobsChannelPreview(ctx, session);
      else await showJobsPreview(ctx, session);
    }
    return;
  }
  if (action === "save_republish") {
    const session = await getSession(CHANNEL, userId);
    if (session?.flow === "horeca" && session.listingId) {
      try {
        await saveAndRepublishHorecaListing(ctx, session, userId);
      } catch (err) {
        console.error("saveAndRepublishHorecaListing failed:", err);
        await ctx.reply(i18n.bot.error);
      }
    } else if (session?.flow === "jobs" && session.listingId) {
      try {
        await saveAndRepublishJobsListing(ctx, session, userId);
      } catch (err) {
        console.error("saveAndRepublishJobsListing failed:", err);
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
      await horecaPromptDailyDuplicate(ctx, session);
    } else if (session?.flow === "jobs") {
      session.horecaStep = HorecaStep.DAILY_DUPLICATE;
      await saveSession(session);
      await jobsPromptDailyDuplicate(ctx, session);
    }
    return;
  }
  if (action === "confirm") {
    const session = await getSession(CHANNEL, userId);
    if (isVacancyFlow(session?.flow) && session.horecaStep) {
      try {
        const submit =
          session.flow === "horeca" ? submitHorecaListing : submitJobsListing;
        const result = await submit(session, userId, ctx.from?.first_name);
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
        console.error("submitVacancyListing failed:", err);
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
    await clearSession(CHANNEL, userId);
    const msg = ctx.callbackQuery?.message;
    if (msg) {
      await showWelcome(ctx, await mainMenuKeyboard(), { edit: true });
    } else {
      await showWelcome(ctx, await mainMenuKeyboard());
    }
    return;
  }
  if (action === "support") {
    const { menu } = await getBotMenu();
    await ctx.reply(menu.supportMessage);
    return;
  }
  if (action === "site") {
    const { menu } = await getBotMenu();
    await ctx.reply(`🌐 ${menu.siteUrl}`);
    return;
  }
  if (action === "channels") {
    await replyChannelsList((text, extra) => ctx.reply(text, extra));
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

  if (slug !== HORECA_SLUG && slug !== JOBS_SLUG) {
    await ctx.editMessageText(i18n.bot.categoryComingSoon, {
      reply_markup: await mainMenuKeyboard(),
    });
    return;
  }

  const session = (await getSession(CHANNEL, userId)) ?? createSession(userId, CHANNEL);
  session.projectId = projectId;
  await saveSession(session);

  if (slug === HORECA_SLUG) {
    await startNewHorecaListing(ctx, session);
    return;
  }

  await ctx.editMessageText(i18n.bot.selectJobsMode, {
    reply_markup: jobsModeKeyboard(),
  });
}

async function handleCategorySelect(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  if (session.flow === "jobs") await startNewJobsListing(ctx, session);
  else await startNewHorecaListing(ctx, session);
}

async function handleCitySelect(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const cityId = ctx.callbackQuery?.data?.replace("city:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  if (session.flow === "horeca") await handleHorecaCity(ctx, session, cityId);
  else if (session.flow === "jobs") await handleJobsCity(ctx, session, cityId);
}

async function handleBrowseCitySelect(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const cityId = ctx.callbackQuery?.data?.replace("browse_city:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session || session.flow !== "browse_jobs") return;
  await handleBrowseJobsCity(ctx, session, cityId);
}

async function handleVacancyCountSelect(ctx: Context): Promise<void> {
  const count = Number(ctx.callbackQuery?.data?.replace("vacancy_count:", "") ?? "0");
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session || !isVacancyFlow(session.flow) || count < 1 || count > 3) return;
  if (session.flow === "horeca") await handleHorecaVacancyCount(ctx, session, count);
  else await handleJobsVacancyCount(ctx, session, count);
}

async function handlePhoto(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  if (session.flow === "horeca") await handleHorecaPhoto(ctx, session);
  else if (session.flow === "jobs") await handleJobsPhoto(ctx, session);
}

async function handleText(ctx: Context): Promise<void> {
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  const text = ctx.message?.text ?? "";

  if (session.flow === "horeca" && session.horecaStep) {
    await handleHorecaText(ctx, session, text);
  } else if (session.flow === "jobs" && session.horecaStep) {
    await handleJobsText(ctx, session, text);
  }
}

async function handleEdit(ctx: Context): Promise<void> {
  await ctx.answerCallbackQuery();
  const target = ctx.callbackQuery?.data?.replace("edit:", "") ?? "";
  const userId = String(ctx.from?.id ?? "");
  const session = await getSession(CHANNEL, userId);
  if (!session) return;
  if (session.flow === "horeca") await handleHorecaEdit(ctx, session, target);
  else if (session.flow === "jobs") await handleJobsEdit(ctx, session, target);
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
  if (session?.flow === "jobs" && session.horecaStep === HorecaStep.CONTACT) {
    await handleJobsContact(ctx, session, contact.phone_number);
    return;
  }

  try {
    await api.botContact(userId, contact.phone_number, ctx.from?.first_name);
    await ctx.reply(i18n.bot.authPhoneLinked, {
      reply_markup: { remove_keyboard: true },
    });
    await showWelcome(ctx, await mainMenuKeyboard());
  } catch (err) {
    const msg = String(err);
    if (msg.includes("does not match")) {
      await ctx.reply(i18n.bot.authPhoneMismatch);
    } else {
      await ctx.reply(i18n.bot.error);
    }
  }
}
