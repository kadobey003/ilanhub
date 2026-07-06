import type { Context } from "grammy";
import {
  HorecaStep,
  formatAddonUah,
  formatAmountUah,
  formatHorecaPostHtml,
  formatHorecaPreview,
  parseStoredPosition,
  type ApiCategory,
  type ApiVacancyType,
  type BotPosition,
  type BotSession,
} from "@ilanhub/shared";
import { i18n, t } from "@ilanhub/i18n";
import { api } from "./api.js";
import {
  dailyDuplicatePrice,
  pinPostPrice,
  pinReserveNote,
} from "./horeca-pricing.js";
import {
  cancelKeyboard,
  cityKeyboard,
  editChannelPreviewKeyboard,
  editMenuKeyboard,
  horecaContactKeyboard,
  previewKeyboard,
  skipActionKeyboard,
  vacancyCountKeyboard,
  yesNoKeyboard,
} from "./keyboards.js";
import { mainMenuKeyboard } from "./bot-menu.js";
import { replyOrEditText } from "./messaging.js";
import { createSession, getSession, saveSession } from "./session.js";

const HORECA_SLUG = "horeca";
const MAX_VACANCIES = 3;
const MIN_PHOTOS = 1;
const SITE_URL = process.env.PUBLIC_URL ?? "https://ilanhub.com";

async function getBundlePricing(projectId: string): Promise<ApiVacancyType[]> {
  const { data } = await api.getVacancyTypes(projectId);
  return data;
}

async function resolveBundlePrice(
  session: BotSession,
): Promise<{ price: number; id?: string }> {
  const count = session.vacancyCount ?? 1;
  if (!session.projectId) return { price: 0 };
  const bundles = await getBundlePricing(session.projectId);
  const bundle = bundles.find((b) => b.vacancyCount === count);
  return { price: bundle?.price ?? 0, id: bundle?.id };
}

export async function computeTotalPrice(session: BotSession): Promise<number> {
  const base = session.bundlePrice ?? session.price ?? 0;
  let total = base;
  const projectId = session.projectId;
  if (!projectId) return total;
  if (session.pinPost) total += await pinPostPrice(projectId);
  if (session.dailyDuplicate) {
    total += await dailyDuplicatePrice(projectId, session.vacancyCount ?? 1);
  }
  return total;
}

function mapPositionToApi(v: BotPosition) {
  const hours = [v.schedule, v.workTime].filter(Boolean).join(", ");
  const descParts = [
    v.experience ? `Досвід: ${v.experience}` : "",
    v.description ?? "",
  ].filter(Boolean);
  return {
    title: v.title,
    salary: v.salary,
    workingHours: hours || v.workingHours,
    description: descParts.join("\n") || undefined,
  };
}

export function parseDescriptionMeta(description?: string | null) {
  const lines = (description ?? "").split("\n");
  const benefits =
    lines
      .filter(
        (l) =>
          !l.startsWith("📌") && !l.startsWith("🔁") && !l.startsWith("📅"),
      )
      .join("\n")
      .trim() || undefined;
  const pinPost = lines.some((l) => l.includes("Закріплення"));
  const dailyDuplicate = lines.some((l) => l.includes("дублювання"));
  const schedLine = lines.find((l) => l.startsWith("📅 Заплановано:"));
  const scheduledPostAt =
    schedLine?.replace(/^📅 Заплановано:\s*/, "").trim() || undefined;
  return { benefits, pinPost, dailyDuplicate, scheduledPostAt };
}

function isEditingExisting(session: BotSession): boolean {
  return Boolean(session.listingId);
}

function isEditField(session: BotSession, target: string): boolean {
  return isEditingExisting(session) && session.editTarget === target;
}

async function persistListingUpdate(
  session: BotSession,
  userId: string,
  firstName?: string,
): Promise<void> {
  if (!session.listingId) return;
  await submitHorecaListing(session, userId, firstName);
}

export async function returnAfterEdit(ctx: Context, session: BotSession): Promise<void> {
  const userId = String(ctx.from?.id ?? session.userId);
  try {
    await persistListingUpdate(session, userId, ctx.from?.first_name);
  } catch (err) {
    console.error("persistListingUpdate failed:", err);
  }
  session.editTarget = undefined;
  session.horecaStep = HorecaStep.EDIT_MENU;
  await saveSession(session);
  await ctx.reply(t("bot.fieldUpdated"));
  await ctx.reply(i18n.bot.horeca.editMenu, {
    reply_markup: editMenuKeyboard(session.listingId),
  });
}

function buildListingPayload(
  session: BotSession,
  userId: string,
  firstName: string | undefined,
  total: number,
  bundle: { price: number; id?: string },
  listingDesc: string,
) {
  return {
    channel: "telegram" as const,
    externalUserId: userId,
    firstName,
    projectId: session.projectId!,
    categoryId: session.categoryId!,
    cityId: session.cityId!,
    districtId: session.districtId,
    businessType: session.businessType,
    title: session.title!,
    address: session.address,
    description: listingDesc || undefined,
    contactPhone: session.contactPhone,
    listingPrice: total,
    bundlePriceId: bundle.id,
    mediaUrls: session.mediaUrls,
    positions: (session.vacancies ?? []).map(mapPositionToApi),
  };
}

function vacancyLabel(session: BotSession): string {
  return session.vacancies?.[session.vacancyIndex ?? 0]?.title ?? "";
}

function resolveDefaultHorecaCategoryId(
  categories: ApiCategory[],
): string | null {
  const active = categories.filter((c) => c.isActive !== false);
  if (!active.length) return null;
  const preferred = ["horeca", "general", "restaurant"];
  for (const slug of preferred) {
    const found = active.find((c) => c.slug === slug);
    if (found) return found.id;
  }
  return active[0]!.id;
}

async function resolveHorecaProjectId(
  session: BotSession,
): Promise<string | null> {
  if (session.projectId) return session.projectId;
  try {
    const config = await api.getTelegramConfig();
    if (config.projectId) return config.projectId;
  } catch {
    // fallback below
  }
  const { data: projects } = await api.getProjects();
  return projects.find((p) => p.slug === HORECA_SLUG)?.id ?? null;
}

export async function startNewHorecaListing(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  try {
    const projectId = await resolveHorecaProjectId(session);
    if (!projectId) {
      await ctx.reply(i18n.bot.error);
      return;
    }

    const { data: categories } = await api.getCategories(projectId);
    const categoryId = resolveDefaultHorecaCategoryId(categories);
    if (!categoryId) {
      await ctx.reply(i18n.bot.error);
      return;
    }

    await startHorecaFlow(ctx, session, projectId, categoryId);
  } catch (err) {
    console.error("startNewHorecaListing failed:", err);
    await ctx.reply(i18n.bot.error);
  }
}

export async function startHorecaFlow(
  ctx: Context,
  session: BotSession,
  projectId: string,
  categoryId: string,
): Promise<void> {
  session.flow = "horeca";
  session.projectId = projectId;
  session.categoryId = categoryId;
  session.cityId = undefined;
  session.districtId = undefined;
  session.horecaStep = HorecaStep.SELECT_CITY;
  session.vacancies = [];
  session.vacancyIndex = 0;
  session.mediaUrls = [];
  session.pinPost = false;
  session.dailyDuplicate = false;
  session.scheduledPostAt = undefined;
  await saveSession(session);

  const { data: cities } = await api.getCities(projectId);
  if (!cities.length) {
    await replyOrEditText(ctx, i18n.bot.noCitiesConfigured, {
      reply_markup: await mainMenuKeyboard(),
    });
    return;
  }
  const text = `${i18n.bot.horeca.intro}\n\n${i18n.bot.horeca.selectCity}`;
  const markup = cityKeyboard(cities);
  await replyOrEditText(ctx, text, { reply_markup: markup });
}

export async function handleHorecaCity(
  ctx: Context,
  session: BotSession,
  cityId: string,
): Promise<void> {
  session.cityId = cityId;
  session.districtId = undefined;

  if (isEditingExisting(session) && session.editTarget === "city") {
    await saveSession(session);
    await returnAfterEdit(ctx, session);
    return;
  }

  session.horecaStep = HorecaStep.BUSINESS_TYPE;
  await saveSession(session);
  await ctx.editMessageText(i18n.bot.horeca.businessType, {
    reply_markup: cancelKeyboard(),
  });
}

async function promptVacancyCount(ctx: Context, session: BotSession): Promise<void> {
  const bundles = session.projectId ? await getBundlePricing(session.projectId) : [];
  await ctx.reply(i18n.bot.horeca.vacancyCount, {
    reply_markup: vacancyCountKeyboard(bundles),
  });
}

async function promptVacancyTitle(ctx: Context, session: BotSession): Promise<void> {
  const n = (session.vacancyIndex ?? 0) + 1;
  const total = session.vacancyCount ?? 1;
  await ctx.reply(t("bot.horeca.vacancyTitle", { n, total }), {
    reply_markup: cancelKeyboard(),
  });
}

async function promptVacancyDescription(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  await ctx.reply(t("bot.horeca.vacancyDescription", { title: vacancyLabel(session) }), {
    reply_markup: skipActionKeyboard("action:vacancy_desc_skip"),
  });
}

async function promptBenefits(ctx: Context): Promise<void> {
  await ctx.reply(i18n.bot.horeca.benefits, {
    reply_markup: skipActionKeyboard("action:benefits_skip"),
  });
}

export async function handleVacancyDescriptionSkip(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  if (session.horecaStep !== HorecaStep.VACANCY_DESCRIPTION) return;
  const idx = session.vacancyIndex ?? 0;
  const vacancies = session.vacancies ?? [];
  if (vacancies[idx]) vacancies[idx].description = undefined;
  session.vacancies = vacancies;
  await saveSession(session);
  await afterVacancyBlock(ctx, session);
}

async function afterVacancyBlock(ctx: Context, session: BotSession): Promise<void> {
  const idx = session.vacancyIndex ?? 0;
  const total = session.vacancyCount ?? 1;
  if (idx + 1 < total) {
    session.vacancyIndex = idx + 1;
    session.horecaStep = HorecaStep.VACANCY_TITLE;
    await saveSession(session);
    await promptVacancyTitle(ctx, session);
  } else {
    if (isEditingExisting(session) && session.editTarget === "vacancies") {
      await saveSession(session);
      await returnAfterEdit(ctx, session);
      return;
    }
    session.horecaStep = HorecaStep.BENEFITS;
    await saveSession(session);
    await promptBenefits(ctx);
  }
}

export async function handleHorecaText(
  ctx: Context,
  session: BotSession,
  text: string,
): Promise<boolean> {
  const step = session.horecaStep;
  if (!step) return false;

  switch (step) {
    case HorecaStep.BUSINESS_TYPE:
      session.businessType = text;
      if (isEditField(session, "venue")) {
        await saveSession(session);
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaStep = HorecaStep.BUSINESS_NAME;
      await saveSession(session);
      await ctx.reply(i18n.bot.horeca.businessName, { reply_markup: cancelKeyboard() });
      return true;

    case HorecaStep.BUSINESS_NAME:
      session.title = text;
      if (isEditField(session, "venue")) {
        await saveSession(session);
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaStep = HorecaStep.ADDRESS;
      await saveSession(session);
      await ctx.reply(i18n.bot.horeca.address, { reply_markup: cancelKeyboard() });
      return true;

    case HorecaStep.ADDRESS:
      session.address = text;
      if (isEditingExisting(session) && session.editTarget === "venue") {
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaStep = HorecaStep.VACANCY_COUNT;
      await saveSession(session);
      await promptVacancyCount(ctx, session);
      return true;

    case HorecaStep.VACANCY_COUNT: {
      const count = Number(text.trim());
      if (!Number.isInteger(count) || count < 1 || count > MAX_VACANCIES) {
        await promptVacancyCount(ctx, session);
        return true;
      }
      await applyVacancyCount(session, count);
      await saveSession(session);
      await promptVacancyTitle(ctx, session);
      return true;
    }

    case HorecaStep.VACANCY_TITLE: {
      const vacancies = session.vacancies ?? [];
      vacancies.push({ title: text });
      session.vacancies = vacancies;
      session.horecaStep = HorecaStep.VACANCY_EXPERIENCE;
      await saveSession(session);
      await ctx.reply(t("bot.horeca.vacancyExperience", { title: text }), {
        reply_markup: cancelKeyboard(),
      });
      return true;
    }

    case HorecaStep.VACANCY_EXPERIENCE: {
      const idx = session.vacancyIndex ?? 0;
      const vacancies = session.vacancies ?? [];
      if (vacancies[idx]) vacancies[idx].experience = text;
      session.vacancies = vacancies;
      session.horecaStep = HorecaStep.VACANCY_SALARY;
      await saveSession(session);
      await ctx.reply(t("bot.horeca.vacancySalary", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      return true;
    }

    case HorecaStep.VACANCY_SALARY: {
      const idx = session.vacancyIndex ?? 0;
      const vacancies = session.vacancies ?? [];
      if (vacancies[idx]) vacancies[idx].salary = text;
      session.vacancies = vacancies;
      session.horecaStep = HorecaStep.VACANCY_SCHEDULE;
      await saveSession(session);
      await ctx.reply(t("bot.horeca.vacancySchedule", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      return true;
    }

    case HorecaStep.VACANCY_SCHEDULE: {
      const idx = session.vacancyIndex ?? 0;
      const vacancies = session.vacancies ?? [];
      if (vacancies[idx]) vacancies[idx].schedule = text;
      session.vacancies = vacancies;
      session.horecaStep = HorecaStep.VACANCY_TIME;
      await saveSession(session);
      await ctx.reply(t("bot.horeca.vacancyTime", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      return true;
    }

    case HorecaStep.VACANCY_TIME: {
      const idx = session.vacancyIndex ?? 0;
      const vacancies = session.vacancies ?? [];
      if (vacancies[idx]) vacancies[idx].workTime = text;
      session.vacancies = vacancies;
      session.horecaStep = HorecaStep.VACANCY_DESCRIPTION;
      await saveSession(session);
      await promptVacancyDescription(ctx, session);
      return true;
    }

    case HorecaStep.VACANCY_DESCRIPTION: {
      const idx = session.vacancyIndex ?? 0;
      const vacancies = session.vacancies ?? [];
      const desc = text.trim() === "-" ? "" : text.trim();
      if (vacancies[idx]) vacancies[idx].description = desc || undefined;
      session.vacancies = vacancies;
      await saveSession(session);
      await afterVacancyBlock(ctx, session);
      return true;
    }

    case HorecaStep.BENEFITS: {
      const benefits = text.trim() === "-" ? "" : text.trim();
      session.benefits = benefits || undefined;
      if (isEditingExisting(session) && session.editTarget === "benefits") {
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaStep = HorecaStep.CONTACT;
      await saveSession(session);
      await ctx.reply(i18n.bot.horeca.contact, {
        reply_markup: horecaContactKeyboard(),
      });
      return true;
    }

    case HorecaStep.CONTACT:
      session.contactPhone = text;
      if (isEditingExisting(session) && session.editTarget === "contact") {
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaStep = HorecaStep.UPLOAD_PHOTOS;
      await saveSession(session);
      await ctx.reply(i18n.bot.horeca.uploadPhotos, {
        reply_markup: { remove_keyboard: true },
      });
      return true;

    case HorecaStep.SCHEDULE_POST:
      if (parseScheduleDate(text)) {
        session.scheduledPostAt = text.trim();
        if (isEditingExisting(session) && session.editTarget === "schedule") {
          await returnAfterEdit(ctx, session);
          return true;
        }
        session.horecaStep = HorecaStep.DAILY_DUPLICATE;
        await saveSession(session);
        await promptDailyDuplicate(ctx, session);
      } else {
        await ctx.reply(i18n.bot.horeca.invalidDate, {
          reply_markup: skipActionKeyboard("action:schedule_skip"),
        });
      }
      return true;

    default:
      return false;
  }
}

export async function handleHorecaContact(
  ctx: Context,
  session: BotSession,
  phone: string,
): Promise<void> {
  session.contactPhone = phone;
  if (isEditingExisting(session) && session.editTarget === "contact") {
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaStep = HorecaStep.UPLOAD_PHOTOS;
  await saveSession(session);
  await ctx.reply(i18n.bot.horeca.uploadPhotos, {
    reply_markup: { remove_keyboard: true },
  });
}

function parseScheduleDate(text: string): boolean {
  return /^\d{2}\.\d{2}\.\d{2,4}\s+\d{1,2}:\d{2}$/.test(text.trim());
}

async function applyVacancyCount(session: BotSession, count: number): Promise<void> {
  session.vacancyCount = count;
  session.vacancyIndex = 0;
  session.vacancies = [];
  session.horecaStep = HorecaStep.VACANCY_TITLE;
  const bundle = await resolveBundlePrice(session);
  session.bundlePrice = bundle.price;
  session.bundlePriceId = bundle.id;
  session.price = bundle.price;
}

export async function handleHorecaVacancyCount(
  ctx: Context,
  session: BotSession,
  count: number,
): Promise<void> {
  await ctx.answerCallbackQuery();
  await applyVacancyCount(session, count);
  await saveSession(session);
  await ctx.editMessageText(
    t("bot.horeca.vacancyTitle", { n: 1, total: count }),
    {
    reply_markup: cancelKeyboard(),
  });
}

export async function handleHorecaPhoto(ctx: Context, session: BotSession): Promise<void> {
  if (session.horecaStep !== HorecaStep.UPLOAD_PHOTOS) return;

  const photos = ctx.message?.photo ?? [];
  const largest = photos[photos.length - 1];
  if (!largest) return;

  session.mediaUrls = [`tg:${largest.file_id}`];
  if (isEditingExisting(session) && session.editTarget === "photo") {
    await saveSession(session);
    await ctx.reply(i18n.bot.horeca.photoAdded);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaStep = HorecaStep.PIN_POST;
  await saveSession(session);

  await ctx.reply(i18n.bot.horeca.photoAdded);
  await promptPinPost(ctx, session);
}

async function promptPinPost(ctx: Context, session: BotSession): Promise<void> {
  const projectId = session.projectId ?? "";
  const price = await pinPostPrice(projectId);
  let text = t("bot.horeca.pinPost", { price: formatAddonUah(price) });
  const reserve = pinReserveNote();
  if (reserve) text += `\n\n${t("bot.horeca.pinReserve", { date: reserve })}`;
  session.horecaStep = HorecaStep.PIN_POST;
  await saveSession(session);
  await ctx.reply(text, {
    reply_markup: yesNoKeyboard("action:pin_yes", "action:pin_no"),
  });
}

export async function handlePinChoice(
  ctx: Context,
  session: BotSession,
  yes: boolean,
): Promise<void> {
  session.pinPost = yes;
  if (isEditingExisting(session) && session.editTarget === "pin") {
    await saveSession(session);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaStep = HorecaStep.SCHEDULE_POST;
  await saveSession(session);
  await ctx.editMessageText(i18n.bot.horeca.schedulePost, {
    reply_markup: skipActionKeyboard("action:schedule_skip"),
  });
}

export async function handleScheduleSkip(ctx: Context, session: BotSession): Promise<void> {
  session.scheduledPostAt = undefined;
  if (isEditingExisting(session) && session.editTarget === "schedule") {
    await saveSession(session);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaStep = HorecaStep.DAILY_DUPLICATE;
  await saveSession(session);
  await promptDailyDuplicate(ctx, session);
}

export async function promptDailyDuplicate(ctx: Context, session: BotSession): Promise<void> {
  const projectId = session.projectId ?? "";
  const price = await dailyDuplicatePrice(projectId, session.vacancyCount ?? 1);
  session.horecaStep = HorecaStep.DAILY_DUPLICATE;
  await saveSession(session);
  const msg = ctx.callbackQuery?.message;
  const text = t("bot.horeca.dailyDuplicate", { price: formatAddonUah(price) });
  const markup = yesNoKeyboard("action:daily_yes", "action:daily_no");
  if (msg) {
    await ctx.editMessageText(text, { reply_markup: markup });
  } else {
    await ctx.reply(text, { reply_markup: markup });
  }
}

export async function handleDailyChoice(
  ctx: Context,
  session: BotSession,
  yes: boolean,
): Promise<void> {
  session.dailyDuplicate = yes;
  if (isEditField(session, "daily")) {
    await saveSession(session);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaStep = HorecaStep.PREVIEW;
  await saveSession(session);
  await showHorecaPreview(ctx, session);
}

function buildChannelPostInput(session: BotSession) {
  return {
    businessType: session.businessType,
    title: session.title ?? "",
    address: session.address,
    benefits: session.benefits,
    contactPhone: session.contactPhone,
    positions: session.vacancies ?? [],
    siteUrl: session.listingId
      ? `${SITE_URL}/horeca/listing/${session.listingId}`
      : undefined,
  };
}

export async function showListingChannelPreview(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  const postHtml = formatHorecaPostHtml(buildChannelPostInput(session));
  const listingId = session.listingId;
  const markup = listingId
    ? editChannelPreviewKeyboard(listingId)
    : editMenuKeyboard(listingId);

  if (ctx.callbackQuery?.message) {
    try {
      await ctx.deleteMessage();
    } catch {
      // ignore
    }
  }

  const photoRef = session.mediaUrls?.[0];
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

export async function saveAndRepublishListing(
  ctx: Context,
  session: BotSession,
  userId: string,
): Promise<void> {
  if (!session.listingId) {
    await ctx.reply(i18n.bot.error);
    return;
  }

  const listingId = session.listingId;
  await submitHorecaListing(session, userId, ctx.from?.first_name);

  const { data: listings } = await api.getUserListings("telegram", userId);
  const listing = listings.find((l) => l.id === listingId);
  const canRepublish = listing
    ? ["published", "expired", "rejected", "approved"].includes(listing.status)
    : false;

  if (canRepublish) {
    await api.resubmitListing(listingId, userId);
    await ctx.reply(t("bot.republishOk"));
  } else {
    await ctx.reply(t("bot.listingUpdated", { id: listingId.slice(0, 8) }));
  }

  session.horecaStep = HorecaStep.EDIT_MENU;
  session.editTarget = undefined;
  await saveSession(session);
  await ctx.reply(i18n.bot.horeca.editMenu, {
    reply_markup: editMenuKeyboard(listingId),
  });
}

export async function showHorecaPreview(ctx: Context, session: BotSession): Promise<void> {
  const bundle = await resolveBundlePrice(session);
  session.bundlePrice = bundle.price;
  session.bundlePriceId = bundle.id;
  session.price = await computeTotalPrice(session);
  await saveSession(session);

  const projectId = session.projectId ?? "";
  const adminFooter: string[] = [
    t("bot.horeca.basePrice", { price: formatAmountUah(bundle.price) }),
  ];
  if (session.pinPost) {
    adminFooter.push(
      t("bot.horeca.addonPin", {
        price: formatAddonUah(await pinPostPrice(projectId)),
      }),
    );
  }
  if (session.dailyDuplicate) {
    adminFooter.push(
      t("bot.horeca.addonDaily", {
        price: formatAddonUah(
          await dailyDuplicatePrice(projectId, session.vacancyCount ?? 1),
        ),
      }),
    );
  }
  adminFooter.push(
    t("bot.horeca.totalPrice", { price: formatAmountUah(session.price ?? 0) }),
  );
  if (session.scheduledPostAt) {
    adminFooter.push(`📅 Публікація: ${session.scheduledPostAt}`);
  }

  const preview = formatHorecaPreview(
    {
      businessType: session.businessType,
      title: session.title ?? "",
      address: session.address,
      benefits: session.benefits,
      contactPhone: session.contactPhone,
      positions: session.vacancies ?? [],
    },
    adminFooter,
  );

  const photoRef = session.mediaUrls?.[0];
  const markup = previewKeyboard();
  const hadMessage = Boolean(ctx.callbackQuery?.message);

  if (hadMessage) {
    try {
      await ctx.deleteMessage();
    } catch {
      // stale or already removed
    }
  }

  if (photoRef) {
    const photo = photoRef.startsWith("tg:") ? photoRef.slice(3) : photoRef;
    if (preview.length <= 1020) {
      await ctx.replyWithPhoto(photo, { caption: preview, reply_markup: markup });
    } else {
      await ctx.replyWithPhoto(photo, { caption: i18n.bot.horeca.preview });
      await ctx.reply(preview, { reply_markup: markup });
    }
    return;
  }

  await ctx.reply(preview, { reply_markup: markup });
}

export async function showEditMenu(ctx: Context, session: BotSession): Promise<void> {
  session.horecaStep = HorecaStep.EDIT_MENU;
  await saveSession(session);
  if (ctx.callbackQuery?.message) {
    try {
      await ctx.deleteMessage();
    } catch {
      // ignore
    }
  }
  await ctx.reply(i18n.bot.horeca.editMenu, {
    reply_markup: editMenuKeyboard(session.listingId),
  });
}

export async function startEditExistingListing(
  ctx: Context,
  userId: string,
  listingId: string,
): Promise<void> {
  try {
    const { data } = await api.getBotListing(listingId, userId);
    const editable = [
      "draft",
      "pending_payment",
      "pending_moderation",
      "rejected",
      "approved",
    ];
    if (!editable.includes(data.status)) {
      await ctx.reply(i18n.bot.myListingsEditBlocked);
      return;
    }

    const meta = parseDescriptionMeta(data.description);
    const vacancies = data.positions.map((p) => {
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

    const session =
      (await getSession("telegram", userId)) ?? createSession(userId, "telegram");
    session.flow = "horeca";
    session.horecaStep = HorecaStep.EDIT_MENU;
    session.listingId = data.id;
    session.projectId = data.projectId;
    session.categoryId = data.categoryId;
    session.cityId = data.cityId;
    session.districtId = undefined;
    session.businessType = data.businessType ?? undefined;
    session.title = data.title;
    session.address = data.address ?? undefined;
    session.benefits = meta.benefits;
    session.pinPost = meta.pinPost;
    session.dailyDuplicate = meta.dailyDuplicate;
    session.scheduledPostAt = meta.scheduledPostAt;
    session.contactPhone = data.contactPhone ?? undefined;
    session.mediaUrls = data.mediaUrls;
    session.vacancies = vacancies;
    session.vacancyCount = vacancies.length || 1;
    session.vacancyIndex = 0;
    session.price = data.price ?? undefined;
    session.editTarget = undefined;
    await saveSession(session);

    await ctx.reply(i18n.bot.horeca.editMenu, {
      reply_markup: editMenuKeyboard(data.id),
    });
  } catch (err) {
    console.error("startEditExistingListing failed:", err);
    await ctx.reply(i18n.bot.error);
  }
}

export async function handleHorecaEdit(
  ctx: Context,
  session: BotSession,
  target: string,
): Promise<void> {
  session.editTarget = target;
  await saveSession(session);
  switch (target) {
    case "city":
      session.horecaStep = HorecaStep.SELECT_CITY;
      await saveSession(session);
      if (session.projectId) {
        const { data: cities } = await api.getCities(session.projectId);
        await ctx.editMessageText(i18n.bot.horeca.selectCity, {
          reply_markup: cityKeyboard(cities),
        });
      }
      break;
    case "venue":
      session.horecaStep = HorecaStep.BUSINESS_TYPE;
      await saveSession(session);
      await ctx.editMessageText(i18n.bot.horeca.businessType, {
        reply_markup: cancelKeyboard(),
      });
      break;
    case "vacancies":
      session.vacancyIndex = 0;
      session.vacancies = [];
      session.horecaStep = HorecaStep.VACANCY_COUNT;
      await saveSession(session);
      await promptVacancyCount(ctx, session);
      break;
    case "benefits":
      session.horecaStep = HorecaStep.BENEFITS;
      await saveSession(session);
      await promptBenefits(ctx);
      break;
    case "contact":
      session.horecaStep = HorecaStep.CONTACT;
      await saveSession(session);
      await ctx.reply(i18n.bot.horeca.contact, { reply_markup: horecaContactKeyboard() });
      break;
    case "photo":
      session.horecaStep = HorecaStep.UPLOAD_PHOTOS;
      if (!isEditingExisting(session)) {
        session.mediaUrls = [];
      }
      await saveSession(session);
      await ctx.reply(i18n.bot.horeca.uploadPhotos);
      break;
    case "pin":
      await promptPinPost(ctx, session);
      break;
    case "schedule":
      session.horecaStep = HorecaStep.SCHEDULE_POST;
      await saveSession(session);
      await ctx.editMessageText(i18n.bot.horeca.schedulePost, {
        reply_markup: skipActionKeyboard("action:schedule_skip"),
      });
      break;
    case "daily":
      await promptDailyDuplicate(ctx, session);
      break;
    default:
      if (session.listingId) {
        await showListingChannelPreview(ctx, session);
      } else {
        await showHorecaPreview(ctx, session);
      }
  }
}

export async function submitHorecaListing(
  session: BotSession,
  userId: string,
  firstName?: string,
): Promise<{ id: string; price: number; status: string; updated?: boolean }> {
  const total = await computeTotalPrice(session);
  const bundle = await resolveBundlePrice(session);
  const listingDesc = [
    session.benefits,
    session.pinPost ? "📌 Закріплення на тиждень" : "",
    session.dailyDuplicate ? "🔁 Щоденне дублювання (7 днів)" : "",
    session.scheduledPostAt ? `📅 Заплановано: ${session.scheduledPostAt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const payload = buildListingPayload(
    session,
    userId,
    firstName,
    total,
    bundle,
    listingDesc,
  );

  if (session.listingId) {
    const { data: listing } = await api.updateBotListing(
      session.listingId,
      payload,
    );
    return {
      id: listing.id,
      price: total,
      status: listing.status ?? "pending_payment",
      updated: true,
    };
  }

  const { data: listing } = await api.createBotListing(payload);
  const submitted = (await api.submitListing(listing.id)) as { status?: string };
  return {
    id: listing.id,
    price: total,
    status: submitted?.status ?? "pending_moderation",
  };
}

export async function resumeHoreca(ctx: Context, session: BotSession): Promise<void> {
  const step = session.horecaStep;
  if (!step || !session.projectId) {
    await ctx.reply(i18n.bot.continue);
    return;
  }

  switch (step) {
    case HorecaStep.SELECT_CITY: {
      const { data: cities } = await api.getCities(session.projectId);
      await ctx.reply(`${i18n.bot.horeca.intro}\n\n${i18n.bot.horeca.selectCity}`, {
        reply_markup: cityKeyboard(cities),
      });
      break;
    }
    case HorecaStep.SELECT_DISTRICT:
      session.horecaStep = session.cityId
        ? HorecaStep.BUSINESS_TYPE
        : HorecaStep.SELECT_CITY;
      await saveSession(session);
      if (session.cityId) {
        await ctx.reply(i18n.bot.horeca.businessType, {
          reply_markup: cancelKeyboard(),
        });
      } else if (session.projectId) {
        const { data: cities } = await api.getCities(session.projectId);
        await ctx.reply(i18n.bot.horeca.selectCity, {
          reply_markup: cityKeyboard(cities),
        });
      }
      break;
    case HorecaStep.BUSINESS_TYPE:
      await ctx.reply(i18n.bot.horeca.businessType, { reply_markup: cancelKeyboard() });
      break;
    case HorecaStep.BUSINESS_NAME:
      await ctx.reply(i18n.bot.horeca.businessName, { reply_markup: cancelKeyboard() });
      break;
    case HorecaStep.ADDRESS:
      await ctx.reply(i18n.bot.horeca.address, { reply_markup: cancelKeyboard() });
      break;
    case HorecaStep.VACANCY_COUNT:
      await promptVacancyCount(ctx, session);
      break;
    case HorecaStep.VACANCY_TITLE:
      await promptVacancyTitle(ctx, session);
      break;
    case HorecaStep.VACANCY_EXPERIENCE:
      await ctx.reply(t("bot.horeca.vacancyExperience", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      break;
    case HorecaStep.VACANCY_SALARY:
      await ctx.reply(t("bot.horeca.vacancySalary", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      break;
    case HorecaStep.VACANCY_SCHEDULE:
      await ctx.reply(t("bot.horeca.vacancySchedule", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      break;
    case HorecaStep.VACANCY_TIME:
      await ctx.reply(t("bot.horeca.vacancyTime", { title: vacancyLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      break;
    case HorecaStep.VACANCY_DESCRIPTION:
      await promptVacancyDescription(ctx, session);
      break;
    case HorecaStep.BENEFITS:
      await promptBenefits(ctx);
      break;
    case HorecaStep.CONTACT:
      await ctx.reply(i18n.bot.horeca.contact, { reply_markup: horecaContactKeyboard() });
      break;
    case HorecaStep.UPLOAD_PHOTOS:
      await ctx.reply(i18n.bot.horeca.uploadPhotos);
      break;
    case HorecaStep.PIN_POST:
      await promptPinPost(ctx, session);
      break;
    case HorecaStep.SCHEDULE_POST:
      await ctx.reply(i18n.bot.horeca.schedulePost, {
        reply_markup: skipActionKeyboard("action:schedule_skip"),
      });
      break;
    case HorecaStep.DAILY_DUPLICATE:
      await promptDailyDuplicate(ctx, session);
      break;
    case HorecaStep.PREVIEW:
    case HorecaStep.EDIT_MENU:
      await showHorecaPreview(ctx, session);
      break;
    default:
      await ctx.reply(i18n.bot.continue);
  }
}

export { HORECA_SLUG };
