import { i18n } from "@ilanhub/i18n";
import type { ApiCategory, ApiCity, ApiProject } from "@ilanhub/shared";

interface ViberButton {
  ActionBody: string;
  Text: string;
  ActionType: "reply";
  Columns: number;
  Rows: number;
}

export function mainMenuKeyboard(): { Type: "keyboard"; Buttons: ViberButton[] } {
  return {
    Type: "keyboard",
    Buttons: [
      { ActionBody: "action:new", Text: i18n.bot.newListing, ActionType: "reply", Columns: 3, Rows: 1 },
      { ActionBody: "action:my", Text: i18n.bot.myListings, ActionType: "reply", Columns: 3, Rows: 1 },
    ],
  };
}

export function itemKeyboard(items: { id: string; name: string }[], prefix: string): { Type: "keyboard"; Buttons: ViberButton[] } {
  const buttons: ViberButton[] = items.map((item) => ({
    ActionBody: `${prefix}:${item.id}`,
    Text: item.name,
    ActionType: "reply" as const,
    Columns: 3,
    Rows: 1,
  }));
  buttons.push({ ActionBody: "action:cancel", Text: i18n.bot.cancel, ActionType: "reply", Columns: 3, Rows: 1 });
  return { Type: "keyboard", Buttons: buttons };
}

export const projectKeyboard = (p: ApiProject[]) => itemKeyboard(p, "project");
export const categoryKeyboard = (c: ApiCategory[]) => itemKeyboard(c, "category");
export const cityKeyboard = (c: ApiCity[]) => itemKeyboard(c, "city");

export function confirmKeyboard(): { Type: "keyboard"; Buttons: ViberButton[] } {
  return {
    Type: "keyboard",
    Buttons: [
      { ActionBody: "action:confirm", Text: i18n.bot.confirm, ActionType: "reply", Columns: 3, Rows: 1 },
      { ActionBody: "action:cancel", Text: i18n.bot.cancel, ActionType: "reply", Columns: 3, Rows: 1 },
    ],
  };
}
