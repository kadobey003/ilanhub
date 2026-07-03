import { ListingState } from "@ilanhub/shared";
import { i18n, stepLabel } from "@ilanhub/i18n";
import { api, sendViberMessage } from "../api.js";
import {
  categoryKeyboard,
  cityKeyboard,
  confirmKeyboard,
  mainMenuKeyboard,
  projectKeyboard,
} from "../keyboards.js";
import {
  clearSession,
  createSession,
  getSession,
  saveSession,
} from "../session.js";

const CHANNEL = "viber" as const;

interface ViberEvent {
  event: string;
  message?: { text?: string; type?: string };
  sender?: { id: string };
}

export async function handleWebhook(payload: ViberEvent): Promise<void> {
  if (payload.event !== "message" || !payload.sender?.id) return;
  const userId = payload.sender.id;
  const text = payload.message?.text ?? "";

  if (text === "/start" || text.toLowerCase() === "start") {
    await clearSession(CHANNEL, userId);
    await sendViberMessage(userId, i18n.bot.welcome, mainMenuKeyboard());
    return;
  }

  if (text.startsWith("action:") || text.startsWith("project:") || text.startsWith("category:") || text.startsWith("city:")) {
    await handleCallback(userId, text);
    return;
  }

  await handleTextInput(userId, text);
}

async function handleCallback(userId: string, data: string): Promise<void> {
  if (data === "action:new") {
    const session = createSession(userId, CHANNEL);
    await saveSession(session);
    const { data: projects } = await api.getProjects();
    await sendViberMessage(userId, `${stepLabel(1)}\n${i18n.bot.selectProject}`, projectKeyboard(projects));
    return;
  }
  if (data === "action:cancel") {
    await clearSession(CHANNEL, userId);
    await sendViberMessage(userId, i18n.bot.welcome, mainMenuKeyboard());
    return;
  }
  if (data.startsWith("project:")) {
    const session = (await getSession(CHANNEL, userId)) ?? createSession(userId, CHANNEL);
    session.projectId = data.replace("project:", "");
    session.state = ListingState.SELECT_CATEGORY;
    await saveSession(session);
    const { data: categories } = await api.getCategories(session.projectId);
    await sendViberMessage(userId, `${stepLabel(2)}\n${i18n.bot.selectCategory}`, categoryKeyboard(categories));
    return;
  }
  if (data.startsWith("category:")) {
    const session = await getSession(CHANNEL, userId);
    if (!session?.projectId) return;
    session.categoryId = data.replace("category:", "");
    session.state = ListingState.SELECT_CITY;
    await saveSession(session);
    const { data: cities } = await api.getCities(session.projectId);
    await sendViberMessage(userId, `${stepLabel(3)}\n${i18n.bot.selectCity}`, cityKeyboard(cities));
    return;
  }
  if (data.startsWith("city:")) {
    const session = await getSession(CHANNEL, userId);
    if (!session) return;
    session.cityId = data.replace("city:", "");
    session.state = ListingState.ADD_POSITIONS;
    await saveSession(session);
    await sendViberMessage(userId, `${stepLabel(4)}\n${i18n.bot.addPositions}`);
    return;
  }
  if (data === "action:confirm") {
    const session = await getSession(CHANNEL, userId);
    if (session?.listingId) {
      await api.submitListing(session.listingId);
      await sendViberMessage(userId, i18n.bot.submitted);
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
    await sendViberMessage(userId, `${stepLabel(5)}\n${i18n.bot.enterTitle}`);
    return;
  }
  if (session.state === ListingState.ENTER_DETAILS) {
    if (!session.title) {
      session.title = text;
      await saveSession(session);
      await sendViberMessage(userId, i18n.bot.enterDescription);
    } else if (!session.description) {
      session.description = text;
      await saveSession(session);
      await sendViberMessage(userId, i18n.bot.enterPrice);
    } else if (session.price === undefined) {
      session.price = Number(text) || 0;
      session.state = ListingState.CONFIRM_PREVIEW;
      await saveSession(session);
      const preview = `${stepLabel(7)}\n📌 ${session.title}\n${session.description}\n💰 ${session.price} ₴`;
      await sendViberMessage(userId, preview, confirmKeyboard());
    }
  }
}
