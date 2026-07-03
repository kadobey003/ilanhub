import { i18n } from "@ilanhub/i18n";

export interface WaButton {
  type: "reply";
  reply: { id: string; title: string };
}

export function mainMenuButtons(): WaButton[] {
  return [
    { type: "reply", reply: { id: "action:new", title: i18n.bot.newListing } },
    { type: "reply", reply: { id: "action:my", title: i18n.bot.myListings } },
  ];
}

export function listButtons(items: { id: string; name: string }[], prefix: string): WaButton[] {
  return items.slice(0, 3).map((item) => ({
    type: "reply" as const,
    reply: { id: `${prefix}:${item.id}`, title: item.name.slice(0, 20) },
  }));
}

export function confirmButtons(): WaButton[] {
  return [
    { type: "reply", reply: { id: "action:confirm", title: i18n.bot.confirm } },
    { type: "reply", reply: { id: "action:cancel", title: i18n.bot.cancel } },
  ];
}

export const templates = {
  welcome: () => i18n.bot.welcome,
  step: (n: number, text: string) => `Крок ${n} з 7\n${text}`,
  submitted: () => i18n.bot.submitted,
};
