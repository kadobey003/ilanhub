import type { Context } from "grammy";
import {
  AUTO_SOURCE_LISTING,
  AutoStep,
  buildAutoTitle,
  formatAddonUah,
  formatAmountUah,
  formatAutoPreview,
  type ApiCategory,
  type ApiVacancyType,
  type BotSession,
  type BotVehicle,
  type VehicleFuel,
  type VehicleTransmission,
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
  previewKeyboard,
  skipActionKeyboard,
  yesNoKeyboard,
  horecaContactKeyboard,
} from "./keyboards.js";
import { mainMenuKeyboard } from "./bot-menu.js";
import { createSession, getSession, saveSession } from "./session.js";
import { buildListingUrl } from "@ilanhub/shared";

const AUTO_SLUG = "auto";
const MIN_PHOTOS = 5;
const MAX_PHOTOS = 20;
const MIN_DESC = 100;

async function getBundlePricing(projectId: string): Promise<ApiVacancyType[]> {
  const { data } = await api.getVacancyTypes(projectId);
  return data;
}

async function resolveBundlePrice(session: BotSession) {
  if (!session.projectId) return { price: 0 };
  const bundles = await getBundlePricing(session.projectId);
  return bundles.find((b) => b.vacancyCount === 1) ?? { price: 0 };
}

export async function computeTotalPrice(session: BotSession): Promise<number> {
  const base = session.bundlePrice ?? session.price ?? 0;
  let total = base;
  const projectId = session.projectId;
  if (!projectId) return total;
  if (session.pinPost) total += await pinPostPrice(projectId);
  if (session.dailyDuplicate) total += await dailyDuplicatePrice(projectId, 1);
  return total;
}

function ensureVehicle(session: BotSession): BotVehicle {
  if (!session.vehicle) {
    session.vehicle = {
      brand: "",
      model: "",
      year: 2000,
      mileage: 0,
      fuelType: "petrol",
      transmission: "manual",
      condition: "used",
      salePrice: 0,
    };
  }
  return session.vehicle;
}

function buildListingPayload(
  session: BotSession,
  userId: string,
  firstName: string | undefined,
  total: number,
  bundle: { price: number; id?: string },
  listingDesc: string,
) {
  const vehicle = session.vehicle!;
  return {
    channel: "telegram" as const,
    externalUserId: userId,
    firstName,
    projectId: session.projectId!,
    categoryId: session.categoryId!,
    cityId: session.cityId!,
    title: buildAutoTitle(vehicle),
    description: listingDesc,
    contactPhone: session.contactPhone,
    listingPrice: total,
    bundlePriceId: bundle.id,
    mediaUrls: session.mediaUrls,
    positions: [],
    vehicle,
    sourceStep: AUTO_SOURCE_LISTING,
  };
}

async function resolveAutoProjectId(session: BotSession): Promise<string | null> {
  if (session.projectId) return session.projectId;
  const { data: projects } = await api.getProjects();
  return projects.find((p) => p.slug === AUTO_SLUG)?.id ?? null;
}

export async function startNewAutoListing(ctx: Context, session: BotSession): Promise<void> {
  const projectId = await resolveAutoProjectId(session);
  if (!projectId) {
    await ctx.reply(i18n.bot.error);
    return;
  }
  session.flow = "auto";
  session.projectId = projectId;
  session.mediaUrls = [];
  session.vehicle = undefined;
  session.autoStep = AutoStep.SELECT_CATEGORY;
  await saveSession(session);

  const { data: categories } = await api.getCategories(projectId);
  const active = categories.filter((c) => c.isActive !== false);
  if (!active.length) {
    await ctx.reply(i18n.bot.error);
    return;
  }
  const kb = {
    inline_keyboard: active.map((c: ApiCategory) => [
      { text: c.name, callback_data: `auto_cat:${c.id}` },
    ]),
  };
  await ctx.reply(t("bot.auto.selectCategory"), { reply_markup: kb });
}

export async function handleAutoCategory(
  ctx: Context,
  session: BotSession,
  categoryId: string,
): Promise<void> {
  session.categoryId = categoryId;
  session.autoStep = AutoStep.SELECT_CITY;
  await saveSession(session);
  const { data: cities } = await api.getCities(session.projectId!);
  await ctx.editMessageText(t("bot.auto.selectCity"), {
    reply_markup: cityKeyboard(cities),
  });
}

export async function handleAutoCity(ctx: Context, session: BotSession, cityId: string): Promise<void> {
  session.cityId = cityId;
  session.autoStep = AutoStep.BRAND;
  await saveSession(session);
  await ctx.editMessageText(t("bot.auto.brand"));
}

export async function handleAutoFuel(
  ctx: Context,
  session: BotSession,
  fuel: VehicleFuel,
): Promise<void> {
  ensureVehicle(session).fuelType = fuel;
  session.autoStep = AutoStep.TRANSMISSION;
  await saveSession(session);
  await ctx.editMessageText(t("bot.auto.transmission"), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Механіка", callback_data: "auto_trans:manual" },
          { text: "Автомат", callback_data: "auto_trans:automatic" },
        ],
      ],
    },
  });
}

export async function handleAutoTransmission(
  ctx: Context,
  session: BotSession,
  transmission: VehicleTransmission,
): Promise<void> {
  ensureVehicle(session).transmission = transmission;
  session.autoStep = AutoStep.COLOR;
  await saveSession(session);
  await ctx.editMessageText(t("bot.auto.color"), {
    reply_markup: skipActionKeyboard("action:auto_color_skip"),
  });
}

export async function handleAutoPhoto(ctx: Context, session: BotSession): Promise<void> {
  if (session.autoStep !== AutoStep.UPLOAD_PHOTOS) return;
  const photos = ctx.message?.photo ?? [];
  const largest = photos[photos.length - 1];
  if (!largest) return;

  if (!session.mediaUrls) session.mediaUrls = [];
  if (session.mediaUrls.length >= MAX_PHOTOS) {
    await ctx.reply(t("bot.auto.maxPhotos", { max: MAX_PHOTOS }));
    return;
  }
  session.mediaUrls.push(`tg:${largest.file_id}`);
  await saveSession(session);
  const count = session.mediaUrls.length;
  const kb = {
    inline_keyboard: [
      [{ text: `✅ Готово (${count})`, callback_data: "action:auto_photos_done" }],
    ],
  };
  await ctx.reply(t("bot.auto.photoAdded", { count, min: MIN_PHOTOS }), {
    reply_markup: count >= MIN_PHOTOS ? kb : cancelKeyboard(),
  });
}

export async function handleAutoPhotosDone(ctx: Context, session: BotSession): Promise<void> {
  if ((session.mediaUrls?.length ?? 0) < MIN_PHOTOS) {
    await ctx.reply(t("bot.auto.minPhotos", { min: MIN_PHOTOS }));
    return;
  }
  session.autoStep = AutoStep.CONTACT;
  await saveSession(session);
  await ctx.reply(t("bot.auto.contact"), { reply_markup: horecaContactKeyboard() });
}

export async function promptPinPost(ctx: Context, session: BotSession): Promise<void> {
  const price = await pinPostPrice(session.projectId ?? "");
  let text = t("bot.auto.pinPost", { price: formatAddonUah(price) });
  const reserve = pinReserveNote();
  if (reserve) text += `\n\n${t("bot.jobs.pinReserve", { date: reserve })}`;
  session.autoStep = AutoStep.PIN_POST;
  await saveSession(session);
  await ctx.reply(text, {
    reply_markup: yesNoKeyboard("action:pin_yes", "action:pin_no"),
  });
}

export async function handleAutoPinChoice(ctx: Context, session: BotSession, yes: boolean): Promise<void> {
  session.pinPost = yes;
  session.autoStep = AutoStep.SCHEDULE_POST;
  await saveSession(session);
  await ctx.editMessageText(t("bot.auto.schedulePost"), {
    reply_markup: skipActionKeyboard("action:schedule_skip"),
  });
}

export async function handleAutoScheduleSkip(ctx: Context, session: BotSession): Promise<void> {
  session.scheduledPostAt = undefined;
  session.autoStep = AutoStep.DAILY_DUPLICATE;
  await saveSession(session);
  await promptDailyDuplicate(ctx, session);
}

export async function promptDailyDuplicate(ctx: Context, session: BotSession): Promise<void> {
  const price = await dailyDuplicatePrice(session.projectId ?? "", 1);
  session.autoStep = AutoStep.DAILY_DUPLICATE;
  await saveSession(session);
  const msg = ctx.callbackQuery?.message;
  const text = t("bot.auto.dailyDuplicate", { price: formatAddonUah(price) });
  if (msg) {
    await ctx.editMessageText(text, {
      reply_markup: yesNoKeyboard("action:daily_yes", "action:daily_no"),
    });
  } else {
    await ctx.reply(text, {
      reply_markup: yesNoKeyboard("action:daily_yes", "action:daily_no"),
    });
  }
}

export async function handleAutoDailyChoice(ctx: Context, session: BotSession, yes: boolean): Promise<void> {
  session.dailyDuplicate = yes;
  session.autoStep = AutoStep.PREVIEW;
  await saveSession(session);
  await showAutoPreview(ctx, session);
}

function previewInput(session: BotSession, siteUrl: string) {
  const vehicle = session.vehicle!;
  const listingDesc = [
    session.description,
    session.pinPost ? "📌 Закріплення на тиждень" : "",
    session.dailyDuplicate ? "🔁 Щоденне дублювання (7 днів)" : "",
    session.scheduledPostAt ? `📅 Заплановано: ${session.scheduledPostAt}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    title: buildAutoTitle(vehicle),
    vehicle,
    description: listingDesc,
    contactPhone: session.contactPhone,
    siteUrl,
  };
}

export async function showAutoPreview(ctx: Context, session: BotSession): Promise<void> {
  const siteUrl = buildListingUrl(process.env.SITE_URL ?? "https://ilanhub.com", AUTO_SLUG, "preview");
  const total = await computeTotalPrice(session);
  const body = formatAutoPreview(previewInput(session, siteUrl), [
    t("bot.auto.totalPrice", { price: formatAmountUah(total) }),
  ]);
  await ctx.reply(body, { reply_markup: previewKeyboard() });
}

export async function submitAutoListing(
  session: BotSession,
  userId: string,
  firstName?: string,
): Promise<{ id: string; price: number; status: string; updated?: boolean }> {
  const total = await computeTotalPrice(session);
  const bundle = await resolveBundlePrice(session);
  const listingDesc = [
    session.description,
    session.pinPost ? "📌 Закріплення на тиждень" : "",
    session.dailyDuplicate ? "🔁 Щоденне дублювання (7 днів)" : "",
    session.scheduledPostAt ? `📅 Заплановано: ${session.scheduledPostAt}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = buildListingPayload(session, userId, firstName, total, bundle, listingDesc);
  const { data: listing } = await api.createBotListing(payload);
  const submitted = (await api.submitListing(listing.id)) as { status?: string };
  return {
    id: listing.id,
    price: total,
    status: submitted.status ?? "pending_moderation",
  };
}

export async function handleAutoText(ctx: Context, session: BotSession): Promise<void> {
  const text = ctx.message?.text?.trim() ?? "";
  if (!text) return;
  const vehicle = ensureVehicle(session);

  switch (session.autoStep) {
    case AutoStep.BRAND:
      vehicle.brand = text;
      session.autoStep = AutoStep.MODEL;
      await saveSession(session);
      await ctx.reply(t("bot.auto.model"));
      break;
    case AutoStep.MODEL:
      vehicle.model = text;
      session.autoStep = AutoStep.YEAR;
      await saveSession(session);
      await ctx.reply(t("bot.auto.year"));
      break;
    case AutoStep.YEAR: {
      const year = Number.parseInt(text, 10);
      if (!Number.isFinite(year) || year < 1980 || year > 2030) {
        await ctx.reply(t("bot.auto.invalidYear"));
        return;
      }
      vehicle.year = year;
      session.autoStep = AutoStep.MILEAGE;
      await saveSession(session);
      await ctx.reply(t("bot.auto.mileage"));
      break;
    }
    case AutoStep.MILEAGE: {
      const mileage = Number.parseInt(text.replace(/\s/g, ""), 10);
      if (!Number.isFinite(mileage) || mileage < 0) {
        await ctx.reply(t("bot.auto.invalidMileage"));
        return;
      }
      vehicle.mileage = mileage;
      session.autoStep = AutoStep.FUEL;
      await saveSession(session);
      await ctx.reply(t("bot.auto.fuel"), {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Бензин", callback_data: "auto_fuel:petrol" },
              { text: "Дизель", callback_data: "auto_fuel:diesel" },
            ],
            [
              { text: "Газ", callback_data: "auto_fuel:gas" },
              { text: "Гібрид", callback_data: "auto_fuel:hybrid" },
            ],
            [{ text: "Електро", callback_data: "auto_fuel:electric" }],
          ],
        },
      });
      break;
    }
    case AutoStep.COLOR:
      vehicle.color = text;
      session.autoStep = AutoStep.SALE_PRICE;
      await saveSession(session);
      await ctx.reply(t("bot.auto.salePrice"));
      break;
    case AutoStep.SALE_PRICE: {
      const price = Number.parseInt(text.replace(/\s/g, ""), 10);
      if (!Number.isFinite(price) || price < 1) {
        await ctx.reply(t("bot.auto.invalidPrice"));
        return;
      }
      vehicle.salePrice = price;
      session.autoStep = AutoStep.DESCRIPTION;
      await saveSession(session);
      await ctx.reply(t("bot.auto.description", { min: MIN_DESC }));
      break;
    }
    case AutoStep.DESCRIPTION:
      if (text.length < MIN_DESC) {
        await ctx.reply(t("bot.auto.descriptionShort", { min: MIN_DESC }));
        return;
      }
      session.description = text;
      session.autoStep = AutoStep.UPLOAD_PHOTOS;
      session.mediaUrls = [];
      await saveSession(session);
      await ctx.reply(t("bot.auto.uploadPhotos", { min: MIN_PHOTOS, max: MAX_PHOTOS }));
      break;
    case AutoStep.CONTACT:
      session.contactPhone = text;
      session.autoStep = AutoStep.PIN_POST;
      await saveSession(session);
      await promptPinPost(ctx, session);
      break;
    case AutoStep.SCHEDULE_POST:
      session.scheduledPostAt = text;
      session.autoStep = AutoStep.DAILY_DUPLICATE;
      await saveSession(session);
      await promptDailyDuplicate(ctx, session);
      break;
    default:
      break;
  }
}

export async function handleAutoColorSkip(ctx: Context, session: BotSession): Promise<void> {
  session.autoStep = AutoStep.SALE_PRICE;
  await saveSession(session);
  await ctx.editMessageText(t("bot.auto.salePrice"));
}

export async function resumeAuto(ctx: Context, session: BotSession): Promise<void> {
  await ctx.reply(t("bot.auto.resume"));
  if (session.autoStep === AutoStep.SELECT_CATEGORY) {
    await startNewAutoListing(ctx, session);
  }
}
