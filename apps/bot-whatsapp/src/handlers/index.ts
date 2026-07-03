import { ListingState } from "@ilanhub/shared";
import { i18n } from "@ilanhub/i18n";
import { api, sendWhatsAppMessage } from "../api.js";
import { clearSession, createSession, getSession, saveSession } from "../session.js";
import { confirmButtons, listButtons, mainMenuButtons, templates } from "../templates.js";

const CHANNEL = "whatsapp" as const;

interface WaWebhook {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          type: string;
          text?: { body: string };
          interactive?: { button_reply?: { id: string } };
        }>;
      };
    }>;
  }>;
}

export async function handleWebhook(payload: WaWebhook): Promise<void> {
  const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages;
  if (!messages?.length) return;

  for (const msg of messages) {
    const userId = msg.from;
    const buttonId = msg.interactive?.button_reply?.id;
    const text = buttonId ?? msg.text?.body ?? "";

    if (text === "/start" || text.toLowerCase() === "start" || text === "action:help") {
      await clearSession(CHANNEL, userId);
      await sendWhatsAppMessage(userId, templates.welcome(), mainMenuButtons());
      continue;
    }

    if (text.startsWith("action:") || text.startsWith("project:") || text.startsWith("category:") || text.startsWith("city:")) {
      await handleCallback(userId, text);
      continue;
    }

    await handleTextInput(userId, text);
  }
}

async function handleCallback(userId: string, data: string): Promise<void> {
  if (data === "action:new") {
    const session = createSession(userId, CHANNEL);
    await saveSession(session);
    const { data: projects } = await api.getProjects();
    await sendWhatsAppMessage(userId, templates.step(1, i18n.bot.selectProject), listButtons(projects, "project"));
    return;
  }
  if (data === "action:cancel") {
    await clearSession(CHANNEL, userId);
    await sendWhatsAppMessage(userId, templates.welcome(), mainMenuButtons());
    return;
  }
  if (data.startsWith("project:")) {
    const session = (await getSession(CHANNEL, userId)) ?? createSession(userId, CHANNEL);
    session.projectId = data.replace("project:", "");
    session.state = ListingState.SELECT_CATEGORY;
    await saveSession(session);
    const { data: categories } = await api.getCategories(session.projectId);
    await sendWhatsAppMessage(userId, templates.step(2, i18n.bot.selectCategory), listButtons(categories, "category"));
    return;
  }
  if (data.startsWith("category:")) {
    const session = await getSession(CHANNEL, userId);
    if (!session?.projectId) return;
    session.categoryId = data.replace("category:", "");
    session.state = ListingState.SELECT_CITY;
    await saveSession(session);
    const { data: cities } = await api.getCities(session.projectId);
    await sendWhatsAppMessage(userId, templates.step(3, i18n.bot.selectCity), listButtons(cities, "city"));
    return;
  }
  if (data.startsWith("city:")) {
    const session = await getSession(CHANNEL, userId);
    if (!session) return;
    session.cityId = data.replace("city:", "");
    session.state = ListingState.ADD_POSITIONS;
    await saveSession(session);
    await sendWhatsAppMessage(userId, templates.step(4, i18n.bot.addPositions));
    return;
  }
  if (data === "action:confirm") {
    const session = await getSession(CHANNEL, userId);
    if (session?.listingId) {
      await api.submitListing(session.listingId);
      await sendWhatsAppMessage(userId, templates.submitted());
      await clearSession(CHANNEL, userId);
    }
  }
}

async function handleTextInput(userId: string, text: string): Promise<void> {
  const session = await getSession(CHANNEL, userId);
  if (!session) return;

  if (session.state === ListingState.ADD_POSITIONS) {
    session.positions = text.split(",").map((s) => s.trim());
    session.state = ListingState.ENTER_DETAILS;
    await saveSession(session);
    await sendWhatsAppMessage(userId, templates.step(5, i18n.bot.enterTitle));
    return;
  }
  if (session.state === ListingState.ENTER_DETAILS) {
    if (!session.title) {
      session.title = text;
      await saveSession(session);
      await sendWhatsAppMessage(userId, i18n.bot.enterDescription);
    } else if (!session.description) {
      session.description = text;
      await saveSession(session);
      await sendWhatsAppMessage(userId, i18n.bot.enterPrice);
    } else if (session.price === undefined) {
      session.price = Number(text) || 0;
      session.state = ListingState.CONFIRM_PREVIEW;
      await saveSession(session);
      const preview = `📌 ${session.title}\n${session.description}\n💰 ${session.price} ₴`;
      await sendWhatsAppMessage(userId, preview, confirmButtons());
    }
  }
}
