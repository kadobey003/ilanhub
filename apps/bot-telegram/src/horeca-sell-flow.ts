import type { Context } from "grammy";
import {
  HORECA_SOURCE_PRODUCT,
  HorecaSellStep,
  formatAddonUah,
  formatAmountUah,
  formatHorecaProductPostHtml,
  formatHorecaProductPreview,
  parseStoredProduct,
  buildListingUrl,
  type ApiCategory,
  type ApiVacancyType,
  type BotProduct,
  type BotSession,
} from "@ilanhub/shared";
import { i18n, t } from "@ilanhub/i18n";
import { api } from "./api.js";
import { computeTotalPrice } from "./horeca-flow.js";
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
import { mainMenuKeyboard, getSiteBaseUrl } from "./bot-menu.js";
import { replyOrEditText } from "./messaging.js";
import { createSession, getSession, saveSession } from "./session.js";

const HORECA_SLUG = "horeca";
const MAX_PRODUCTS = 3;

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

function mapProductToApi(p: BotProduct) {
  return {
    title: p.title,
    salary: p.price ? `💰 ${p.price}` : undefined,
    workingHours: p.condition ? `📦 Стан: ${p.condition}` : undefined,
    description: p.description || undefined,
  };
}

function productLabel(session: BotSession): string {
  return session.products?.[session.vacancyIndex ?? 0]?.title ?? "";
}

function isEditingExisting(session: BotSession): boolean {
  return Boolean(session.listingId);
}

function isEditField(session: BotSession, target: string): boolean {
  return isEditingExisting(session) && session.editTarget === target;
}

function resolveProductCategoryId(categories: ApiCategory[]): string | null {
  const active = categories.filter((c) => c.isActive !== false);
  if (!active.length) return null;
  const preferred = ["used-equipment", "equipment", "horeca", "restaurant"];
  for (const slug of preferred) {
    const found = active.find((c) => c.slug === slug);
    if (found) return found.id;
  }
  return active[0]!.id;
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
    sourceStep: HORECA_SOURCE_PRODUCT,
    positions: (session.products ?? []).map(mapProductToApi),
  };
}

async function applyProductCount(session: BotSession, count: number): Promise<void> {
  session.vacancyCount = count;
  session.vacancyIndex = 0;
  session.products = [];
  const bundle = await resolveBundlePrice(session);
  session.bundlePrice = bundle.price;
  session.bundlePriceId = bundle.id;
  session.horecaSellStep = HorecaSellStep.PRODUCT_TITLE;
}

export async function startNewHorecaSellListing(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  try {
    const projectId = session.projectId;
    if (!projectId) {
      await ctx.reply(i18n.bot.error);
      return;
    }

    const { data: categories } = await api.getCategories(projectId);
    const categoryId = resolveProductCategoryId(categories);
    if (!categoryId) {
      await ctx.reply(i18n.bot.error);
      return;
    }

    await startHorecaSellFlow(ctx, session, projectId, categoryId);
  } catch (err) {
    console.error("startNewHorecaSellListing failed:", err);
    await ctx.reply(i18n.bot.error);
  }
}

export async function startHorecaSellFlow(
  ctx: Context,
  session: BotSession,
  projectId: string,
  categoryId: string,
): Promise<void> {
  session.flow = "horeca_sell";
  session.projectId = projectId;
  session.categoryId = categoryId;
  session.cityId = undefined;
  session.districtId = undefined;
  session.horecaSellStep = HorecaSellStep.SELECT_CITY;
  session.products = [];
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
  const text = `${i18n.bot.horecaSell.intro}\n\n${i18n.bot.horecaSell.selectCity}`;
  await replyOrEditText(ctx, text, { reply_markup: cityKeyboard(cities) });
}

export async function handleHorecaSellCity(
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

  session.horecaSellStep = HorecaSellStep.BUSINESS_TYPE;
  await saveSession(session);
  await ctx.editMessageText(i18n.bot.horecaSell.businessType, {
    reply_markup: cancelKeyboard(),
  });
}

async function promptProductCount(ctx: Context, session: BotSession): Promise<void> {
  const bundles = session.projectId ? await getBundlePricing(session.projectId) : [];
  await ctx.reply(i18n.bot.horecaSell.productCount, {
    reply_markup: vacancyCountKeyboard(bundles),
  });
}

async function promptProductTitle(ctx: Context, session: BotSession): Promise<void> {
  const n = (session.vacancyIndex ?? 0) + 1;
  const total = session.vacancyCount ?? 1;
  await ctx.reply(t("bot.horecaSell.productTitle", { n, total }), {
    reply_markup: cancelKeyboard(),
  });
}

async function afterProductBlock(ctx: Context, session: BotSession): Promise<void> {
  const idx = session.vacancyIndex ?? 0;
  const total = session.vacancyCount ?? 1;
  if (idx + 1 < total) {
    session.vacancyIndex = idx + 1;
    session.horecaSellStep = HorecaSellStep.PRODUCT_TITLE;
    await saveSession(session);
    await promptProductTitle(ctx, session);
  } else {
    if (isEditingExisting(session) && session.editTarget === "products") {
      await saveSession(session);
      await returnAfterEdit(ctx, session);
      return;
    }
    session.horecaSellStep = HorecaSellStep.CONTACT;
    await saveSession(session);
    await ctx.reply(i18n.bot.horecaSell.contact, {
      reply_markup: horecaContactKeyboard(),
    });
  }
}

export async function handleHorecaSellText(
  ctx: Context,
  session: BotSession,
  text: string,
): Promise<boolean> {
  const step = session.horecaSellStep;
  if (!step) return false;

  switch (step) {
    case HorecaSellStep.BUSINESS_TYPE:
      session.businessType = text;
      if (isEditField(session, "venue")) {
        await saveSession(session);
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaSellStep = HorecaSellStep.BUSINESS_NAME;
      await saveSession(session);
      await ctx.reply(i18n.bot.horecaSell.businessName, {
        reply_markup: cancelKeyboard(),
      });
      return true;

    case HorecaSellStep.BUSINESS_NAME:
      session.title = text;
      if (isEditField(session, "venue")) {
        await saveSession(session);
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaSellStep = HorecaSellStep.ADDRESS;
      await saveSession(session);
      await ctx.reply(i18n.bot.horecaSell.address, {
        reply_markup: cancelKeyboard(),
      });
      return true;

    case HorecaSellStep.ADDRESS:
      session.address = text;
      if (isEditingExisting(session) && session.editTarget === "venue") {
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaSellStep = HorecaSellStep.PRODUCT_COUNT;
      await saveSession(session);
      await promptProductCount(ctx, session);
      return true;

    case HorecaSellStep.PRODUCT_COUNT: {
      const count = Number(text.trim());
      if (!Number.isInteger(count) || count < 1 || count > MAX_PRODUCTS) {
        await promptProductCount(ctx, session);
        return true;
      }
      await applyProductCount(session, count);
      await saveSession(session);
      await promptProductTitle(ctx, session);
      return true;
    }

    case HorecaSellStep.PRODUCT_TITLE: {
      const products = session.products ?? [];
      products.push({ title: text });
      session.products = products;
      session.horecaSellStep = HorecaSellStep.PRODUCT_PRICE;
      await saveSession(session);
      await ctx.reply(t("bot.horecaSell.productPrice", { title: text }), {
        reply_markup: cancelKeyboard(),
      });
      return true;
    }

    case HorecaSellStep.PRODUCT_PRICE: {
      const products = session.products ?? [];
      const idx = session.vacancyIndex ?? 0;
      if (products[idx]) products[idx].price = text;
      session.products = products;
      session.horecaSellStep = HorecaSellStep.PRODUCT_CONDITION;
      await saveSession(session);
      await ctx.reply(t("bot.horecaSell.productCondition", { title: productLabel(session) }), {
        reply_markup: cancelKeyboard(),
      });
      return true;
    }

    case HorecaSellStep.PRODUCT_CONDITION: {
      const products = session.products ?? [];
      const idx = session.vacancyIndex ?? 0;
      if (products[idx]) products[idx].condition = text;
      session.products = products;
      session.horecaSellStep = HorecaSellStep.PRODUCT_DESCRIPTION;
      await saveSession(session);
      await ctx.reply(t("bot.horecaSell.productDescription", { title: productLabel(session) }), {
        reply_markup: skipActionKeyboard("action:product_desc_skip"),
      });
      return true;
    }

    case HorecaSellStep.PRODUCT_DESCRIPTION: {
      const products = session.products ?? [];
      const idx = session.vacancyIndex ?? 0;
      if (products[idx]) products[idx].description = text;
      session.products = products;
      await saveSession(session);
      await afterProductBlock(ctx, session);
      return true;
    }

    case HorecaSellStep.CONTACT:
      session.contactPhone = text;
      if (isEditField(session, "contact")) {
        await saveSession(session);
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaSellStep = HorecaSellStep.UPLOAD_PHOTOS;
      await saveSession(session);
      await ctx.reply(i18n.bot.horecaSell.uploadPhotos);
      return true;

    case HorecaSellStep.SCHEDULE_POST: {
      if (!/^\d{2}\.\d{2}\.\d{2,4}\s+\d{1,2}:\d{2}$/.test(text.trim())) {
        await ctx.reply(i18n.bot.horecaSell.invalidDate);
        return true;
      }
      session.scheduledPostAt = text.trim();
      if (isEditField(session, "schedule")) {
        await saveSession(session);
        await returnAfterEdit(ctx, session);
        return true;
      }
      session.horecaSellStep = HorecaSellStep.DAILY_DUPLICATE;
      await saveSession(session);
      await promptDailyDuplicate(ctx, session);
      return true;
    }

    default:
      return false;
  }
}

export async function handleHorecaSellProductDescriptionSkip(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  if (session.horecaSellStep !== HorecaSellStep.PRODUCT_DESCRIPTION) return;
  const idx = session.vacancyIndex ?? 0;
  const products = session.products ?? [];
  if (products[idx]) products[idx].description = undefined;
  session.products = products;
  await saveSession(session);
  await afterProductBlock(ctx, session);
}

export async function handleHorecaSellVacancyCount(
  ctx: Context,
  session: BotSession,
  count: number,
): Promise<void> {
  await ctx.answerCallbackQuery();
  await applyProductCount(session, count);
  await saveSession(session);
  await ctx.editMessageText(
    t("bot.horecaSell.productTitle", { n: 1, total: count }),
    { reply_markup: cancelKeyboard() },
  );
}

export async function handleHorecaSellContact(
  ctx: Context,
  session: BotSession,
  phone: string,
): Promise<void> {
  session.contactPhone = phone;
  if (isEditField(session, "contact")) {
    await saveSession(session);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaSellStep = HorecaSellStep.UPLOAD_PHOTOS;
  await saveSession(session);
  await ctx.reply(i18n.bot.horecaSell.uploadPhotos);
}

export async function handleHorecaSellPhoto(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  if (session.horecaSellStep !== HorecaSellStep.UPLOAD_PHOTOS) return;

  const photos = ctx.message?.photo ?? [];
  const largest = photos[photos.length - 1];
  if (!largest) return;

  session.mediaUrls = [`tg:${largest.file_id}`];
  if (isEditingExisting(session) && session.editTarget === "photo") {
    await saveSession(session);
    await ctx.reply(i18n.bot.horecaSell.photoAdded);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaSellStep = HorecaSellStep.PIN_POST;
  await saveSession(session);
  await ctx.reply(i18n.bot.horecaSell.photoAdded);
  await promptPinPost(ctx, session);
}

async function promptPinPost(ctx: Context, session: BotSession): Promise<void> {
  const projectId = session.projectId ?? "";
  const price = await pinPostPrice(projectId);
  let text = t("bot.horecaSell.pinPost", { price: formatAddonUah(price) });
  const reserve = pinReserveNote();
  if (reserve) text += `\n\n${t("bot.horecaSell.pinReserve", { date: reserve })}`;
  session.horecaSellStep = HorecaSellStep.PIN_POST;
  await saveSession(session);
  await ctx.reply(text, {
    reply_markup: yesNoKeyboard("action:pin_yes", "action:pin_no"),
  });
}

export async function handleHorecaSellPinChoice(
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
  session.horecaSellStep = HorecaSellStep.SCHEDULE_POST;
  await saveSession(session);
  await ctx.editMessageText(i18n.bot.horecaSell.schedulePost, {
    reply_markup: skipActionKeyboard("action:schedule_skip"),
  });
}

export async function handleHorecaSellScheduleSkip(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  session.scheduledPostAt = undefined;
  if (isEditingExisting(session) && session.editTarget === "schedule") {
    await saveSession(session);
    await returnAfterEdit(ctx, session);
    return;
  }
  session.horecaSellStep = HorecaSellStep.DAILY_DUPLICATE;
  await saveSession(session);
  await promptDailyDuplicate(ctx, session);
}

export async function promptDailyDuplicate(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  const projectId = session.projectId ?? "";
  const price = await dailyDuplicatePrice(projectId, session.vacancyCount ?? 1);
  session.horecaSellStep = HorecaSellStep.DAILY_DUPLICATE;
  await saveSession(session);
  const msg = ctx.callbackQuery?.message;
  const text = t("bot.horecaSell.dailyDuplicate", { price: formatAddonUah(price) });
  const markup = yesNoKeyboard("action:daily_yes", "action:daily_no");
  if (msg) {
    await ctx.editMessageText(text, { reply_markup: markup });
  } else {
    await ctx.reply(text, { reply_markup: markup });
  }
}

export async function handleHorecaSellDailyChoice(
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
  session.horecaSellStep = HorecaSellStep.PREVIEW;
  await saveSession(session);
  await showHorecaSellPreview(ctx, session);
}

async function buildPreviewInput(session: BotSession) {
  const baseUrl = await getSiteBaseUrl();
  return {
    businessType: session.businessType,
    title: session.title ?? "",
    address: session.address,
    contactPhone: session.contactPhone,
    products: session.products ?? [],
    siteUrl: session.listingId
      ? buildListingUrl(baseUrl, HORECA_SLUG, session.listingId)
      : undefined,
  };
}

async function buildPriceFooter(session: BotSession): Promise<string[]> {
  const total = await computeTotalPrice(session);
  const bundle = await resolveBundlePrice(session);
  const lines = [
    t("bot.horecaSell.basePrice", { price: formatAmountUah(bundle.price) }),
  ];
  if (session.pinPost) {
    const pin = await pinPostPrice(session.projectId ?? "");
    lines.push(t("bot.horecaSell.addonPin", { price: formatAddonUah(pin) }));
  }
  if (session.dailyDuplicate) {
    const daily = await dailyDuplicatePrice(
      session.projectId ?? "",
      session.vacancyCount ?? 1,
    );
    lines.push(t("bot.horecaSell.addonDaily", { price: formatAddonUah(daily) }));
  }
  lines.push(t("bot.horecaSell.totalPrice", { price: formatAmountUah(total) }));
  return lines;
}

export async function showHorecaSellPreview(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  const input = await buildPreviewInput(session);
  const footer = await buildPriceFooter(session);
  const preview = formatHorecaProductPreview(input, footer);

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
    await ctx.replyWithPhoto(photo, {
      caption: preview.length <= 1020 ? preview : i18n.bot.horecaSell.preview,
      reply_markup: previewKeyboard(),
    });
    if (preview.length > 1020) {
      await ctx.reply(preview, { reply_markup: previewKeyboard() });
    }
  } else {
    await ctx.reply(preview, { reply_markup: previewKeyboard() });
  }
}

export async function showHorecaSellChannelPreview(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  const postHtml = formatHorecaProductPostHtml(await buildPreviewInput(session));
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
      await ctx.replyWithPhoto(photo, { caption: i18n.bot.horecaSell.preview });
      await ctx.reply(postHtml, { parse_mode: "HTML", reply_markup: markup });
    }
  } else {
    await ctx.reply(postHtml, { parse_mode: "HTML", reply_markup: markup });
  }
}

export async function returnAfterEdit(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  session.editTarget = undefined;
  session.horecaSellStep = HorecaSellStep.EDIT_MENU;
  await saveSession(session);
  if (session.listingId) {
    await showHorecaSellChannelPreview(ctx, session);
  } else {
    await showHorecaSellPreview(ctx, session);
  }
}

export async function submitHorecaSellListing(
  session: BotSession,
  userId: string,
  firstName?: string,
): Promise<{ id: string; price: number; status: string; updated?: boolean }> {
  const total = await computeTotalPrice(session);
  const bundle = await resolveBundlePrice(session);
  const listingDesc = [
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
    const { data: listing } = await api.updateBotListing(session.listingId, payload);
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

export async function resumeHorecaSell(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  const step = session.horecaSellStep;
  if (!step || !session.projectId) {
    await ctx.reply(i18n.bot.continue);
    return;
  }

  switch (step) {
    case HorecaSellStep.SELECT_CITY: {
      const { data: cities } = await api.getCities(session.projectId);
      await ctx.reply(`${i18n.bot.horecaSell.intro}\n\n${i18n.bot.horecaSell.selectCity}`, {
        reply_markup: cityKeyboard(cities),
      });
      break;
    }
    case HorecaSellStep.BUSINESS_TYPE:
      await ctx.reply(i18n.bot.horecaSell.businessType, {
        reply_markup: cancelKeyboard(),
      });
      break;
    case HorecaSellStep.BUSINESS_NAME:
      await ctx.reply(i18n.bot.horecaSell.businessName, {
        reply_markup: cancelKeyboard(),
      });
      break;
    case HorecaSellStep.ADDRESS:
      await ctx.reply(i18n.bot.horecaSell.address, { reply_markup: cancelKeyboard() });
      break;
    case HorecaSellStep.PRODUCT_COUNT:
      await promptProductCount(ctx, session);
      break;
    case HorecaSellStep.PRODUCT_TITLE:
      await promptProductTitle(ctx, session);
      break;
    case HorecaSellStep.CONTACT:
      await ctx.reply(i18n.bot.horecaSell.contact, {
        reply_markup: horecaContactKeyboard(),
      });
      break;
    case HorecaSellStep.UPLOAD_PHOTOS:
      await ctx.reply(i18n.bot.horecaSell.uploadPhotos);
      break;
    case HorecaSellStep.PIN_POST:
      await promptPinPost(ctx, session);
      break;
    case HorecaSellStep.DAILY_DUPLICATE:
      await promptDailyDuplicate(ctx, session);
      break;
    case HorecaSellStep.PREVIEW:
      await showHorecaSellPreview(ctx, session);
      break;
    default:
      await ctx.reply(i18n.bot.continue);
  }
}

export async function saveAndRepublishListing(
  ctx: Context,
  session: BotSession,
  userId: string,
): Promise<void> {
  await submitHorecaSellListing(session, userId, ctx.from?.first_name);
  await ctx.reply(t("bot.republishOk"));
}

export async function handleHorecaSellEdit(
  ctx: Context,
  session: BotSession,
  target: string,
): Promise<void> {
  session.editTarget = target;
  await saveSession(session);
  switch (target) {
    case "city":
      session.horecaSellStep = HorecaSellStep.SELECT_CITY;
      await saveSession(session);
      if (session.projectId) {
        const { data: cities } = await api.getCities(session.projectId);
        await ctx.editMessageText(i18n.bot.horecaSell.selectCity, {
          reply_markup: cityKeyboard(cities),
        });
      }
      break;
    case "venue":
      session.horecaSellStep = HorecaSellStep.BUSINESS_TYPE;
      await saveSession(session);
      await ctx.editMessageText(i18n.bot.horecaSell.businessType, {
        reply_markup: cancelKeyboard(),
      });
      break;
    case "vacancies":
      session.vacancyIndex = 0;
      session.products = [];
      session.horecaSellStep = HorecaSellStep.PRODUCT_COUNT;
      await saveSession(session);
      await promptProductCount(ctx, session);
      break;
    case "benefits":
      await showHorecaSellChannelPreview(ctx, session);
      break;
    case "contact":
      session.horecaSellStep = HorecaSellStep.CONTACT;
      await saveSession(session);
      await ctx.reply(i18n.bot.horecaSell.contact, { reply_markup: horecaContactKeyboard() });
      break;
    case "photo":
      session.horecaSellStep = HorecaSellStep.UPLOAD_PHOTOS;
      if (!session.listingId) session.mediaUrls = [];
      await saveSession(session);
      await ctx.reply(i18n.bot.horecaSell.uploadPhotos);
      break;
    case "pin":
      await promptPinPost(ctx, session);
      break;
    case "schedule":
      session.horecaSellStep = HorecaSellStep.SCHEDULE_POST;
      await saveSession(session);
      await ctx.editMessageText(i18n.bot.horecaSell.schedulePost, {
        reply_markup: skipActionKeyboard("action:schedule_skip"),
      });
      break;
    case "daily":
      await promptDailyDuplicate(ctx, session);
      break;
    default:
      if (session.listingId) await showHorecaSellChannelPreview(ctx, session);
      else await showHorecaSellPreview(ctx, session);
  }
}

function parseSellDescriptionMeta(description?: string | null) {
  const lines = (description ?? "").split("\n");
  const pinPost = lines.some((l) => l.includes("Закріплення"));
  const dailyDuplicate = lines.some((l) => l.includes("дублювання"));
  const schedLine = lines.find((l) => l.startsWith("📅 Заплановано:"));
  const scheduledPostAt =
    schedLine?.replace(/^📅 Заплановано:\s*/, "").trim() || undefined;
  return { pinPost, dailyDuplicate, scheduledPostAt };
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

    const meta = parseSellDescriptionMeta(data.description);
    const products = data.positions.map((p) => {
      const parsed = parseStoredProduct(p);
      return {
        title: parsed.title,
        price: parsed.price,
        condition: parsed.condition,
        description: parsed.description,
      };
    });

    const session =
      (await getSession("telegram", userId)) ?? createSession(userId, "telegram");
    session.flow = "horeca_sell";
    session.horecaSellStep = HorecaSellStep.EDIT_MENU;
    session.listingId = data.id;
    session.projectId = data.projectId;
    session.categoryId = data.categoryId;
    session.cityId = data.cityId;
    session.businessType = data.businessType ?? undefined;
    session.title = data.title;
    session.address = data.address ?? undefined;
    session.pinPost = meta.pinPost;
    session.dailyDuplicate = meta.dailyDuplicate;
    session.scheduledPostAt = meta.scheduledPostAt;
    session.contactPhone = data.contactPhone ?? undefined;
    session.mediaUrls = data.mediaUrls;
    session.products = products;
    session.vacancyCount = products.length || 1;
    session.vacancyIndex = 0;
    session.price = data.price ?? undefined;
    session.editTarget = undefined;
    await saveSession(session);

    await ctx.reply(i18n.bot.horeca.editMenu, {
      reply_markup: editMenuKeyboard(data.id),
    });
  } catch (err) {
    console.error("startEditExistingSellListing failed:", err);
    await ctx.reply(i18n.bot.error);
  }
}
