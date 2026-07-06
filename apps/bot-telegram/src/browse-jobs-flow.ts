import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import type { ApiCity, BotSession } from "@ilanhub/shared";
import { i18n, t } from "@ilanhub/i18n";
import { api } from "./api.js";
import { cityKeyboard } from "./keyboards.js";
import { getBotMenu, getSiteBaseUrl, mainMenuKeyboard } from "./bot-menu.js";
import { replyOrEditText } from "./messaging.js";
import { saveSession } from "./session.js";

const JOBS_SLUG = "jobs";

async function resolveJobsProjectId(): Promise<string | null> {
  try {
    const config = await api.getTelegramConfig();
    if (config.projectId) {
      const { data: projects } = await api.getProjects();
      const match = projects.find((p) => p.id === config.projectId);
      if (match?.slug === JOBS_SLUG) return config.projectId;
    }
  } catch {
    // fallback
  }
  const { data: projects } = await api.getProjects();
  return projects.find((p) => p.slug === JOBS_SLUG)?.id ?? null;
}

export async function startBrowseJobs(
  ctx: Context,
  session: BotSession,
): Promise<void> {
  try {
    const projectId = await resolveJobsProjectId();
    if (!projectId) {
      await ctx.reply(i18n.bot.error);
      return;
    }

    session.flow = "browse_jobs";
    session.projectId = projectId;
    await saveSession(session);

    const { data: cities } = await api.getCities(projectId);
    if (!cities.length) {
      await replyOrEditText(ctx, i18n.bot.noCitiesConfigured, {
        reply_markup: await mainMenuKeyboard(),
      });
      return;
    }

    const text = `${i18n.bot.browseJobs.intro}\n\n${i18n.bot.browseJobs.selectCity}`;
    await replyOrEditText(ctx, text, {
      reply_markup: browseCityKeyboard(cities),
    });
  } catch (err) {
    console.error("startBrowseJobs failed:", err);
    await ctx.reply(i18n.bot.error);
  }
}

function browseCityKeyboard(cities: ApiCity[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  const seen = new Set<string>();
  const unique = cities.filter((c) => {
    const key = c.slug || c.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.forEach((c, i) => {
    if (i > 0 && i % 2 === 0) kb.row();
    kb.text(c.name, `browse_city:${c.id}`);
  });
  kb.row().text(i18n.bot.cancel, "action:cancel");
  return kb;
}

export async function handleBrowseJobsCity(
  ctx: Context,
  session: BotSession,
  cityId: string,
): Promise<void> {
  const projectId = session.projectId;
  if (!projectId) return;

  const { data: cities } = await api.getCities(projectId);
  const city = cities.find((c) => c.id === cityId);
  if (!city) {
    await ctx.reply(i18n.bot.error);
    return;
  }

  const baseUrl = await getSiteBaseUrl();
  const siteUrl = `${baseUrl}/jobs/${city.slug}/ogoloshennya`;

  const text = t("bot.browseJobs.result", {
    city: city.name,
    siteUrl,
  });

  const kb = new InlineKeyboard().url("🌐 Вакансії на сайті", siteUrl);

  const { channels } = await getBotMenu();
  const jobsChannels = channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes("робот") ||
      ch.name.toLowerCase().includes("jobs") ||
      ch.name.toLowerCase().includes("ваканс"),
  );
  const channelList = jobsChannels.length ? jobsChannels : channels;
  channelList.slice(0, 3).forEach((ch) => {
    kb.row().url(`📢 ${ch.name}`, ch.url);
  });
  kb.row().text(i18n.bot.mainMenu, "action:menu");

  session.flow = undefined;
  await saveSession(session);

  await ctx.editMessageText(text, { reply_markup: kb });
}

export { JOBS_SLUG as BROWSE_JOBS_SLUG };
