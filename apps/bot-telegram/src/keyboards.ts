import { InlineKeyboard, Keyboard } from "grammy";
import { i18n } from "@ilanhub/i18n";
import type {
  ApiCategory,
  ApiCity,
  ApiListing,
  ApiProject,
  ApiVacancyType,
} from "@ilanhub/shared";
import { formatAmountUah } from "@ilanhub/shared";

export interface BotMenuConfig {
  supportMessage: string;
  siteUrl: string;
  supportLabel: string;
  siteLabel: string;
  channelsLabel: string;
  showSupport: boolean;
  showSite: boolean;
  showChannels: boolean;
}

export function buildMainMenuKeyboard(menu: BotMenuConfig): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text(i18n.bot.newListing, "action:new")
    .text(i18n.bot.myListings, "action:my");

  const secondRow: Array<{ label: string; action: string }> = [];
  if (menu.showSupport) {
    secondRow.push({ label: menu.supportLabel, action: "support" });
  }
  if (menu.showSite) {
    secondRow.push({ label: menu.siteLabel, action: "site" });
  }
  if (secondRow.length) {
    kb.row();
    secondRow.forEach((btn) => kb.text(btn.label, `action:${btn.action}`));
  }

  if (menu.showChannels) {
    kb.row().text(menu.channelsLabel, "action:channels");
  }

  kb.row().text(i18n.bot.browseJobsBtn, "action:browse_jobs");

  return kb;
}

export function channelsKeyboard(
  channels: Array<{ name: string; url: string }>,
): InlineKeyboard {
  const kb = new InlineKeyboard();
  channels.forEach((ch, i) => {
    if (i > 0) kb.row();
    kb.url(ch.name, ch.url);
  });
  kb.row().text(i18n.bot.mainMenu, "action:menu");
  return kb;
}

/** @deprecated use mainMenuKeyboard from bot-menu.ts */
export function defaultMainMenuKeyboard(): InlineKeyboard {
  return buildMainMenuKeyboard({
    supportMessage: i18n.bot.supportMessage,
    siteUrl: process.env.PUBLIC_URL ?? "https://ilanhub.com",
    supportLabel: i18n.bot.support,
    siteLabel: i18n.bot.ourSite,
    channelsLabel: i18n.bot.ourChannels,
    showSupport: true,
    showSite: true,
    showChannels: true,
  });
}

export function categoryKeyboard(projects: ApiProject[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  projects.forEach((p, i) => {
    if (i > 0 && i % 2 === 0) kb.row();
    kb.text(p.name, `project:${p.id}:${p.slug}`);
  });
  kb.row().text(i18n.bot.cancel, "action:cancel");
  return kb;
}

export function jobsModeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.postVacancy, "action:jobs_post")
    .row()
    .text(i18n.bot.browseJobsBtn, "action:browse_jobs")
    .row()
    .text(i18n.bot.cancel, "action:cancel");
}

export function horecaModeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.postHorecaVacancy, "action:horeca_post")
    .row()
    .text(i18n.bot.postHorecaSell, "action:horeca_sell")
    .row()
    .text(i18n.bot.cancel, "action:cancel");
}

export function horecaCategoryKeyboard(categories: ApiCategory[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  categories.forEach((c, i) => {
    if (i > 0 && i % 2 === 0) kb.row();
    kb.text(c.name, `category:${c.id}`);
  });
  kb.row().text(i18n.bot.cancel, "action:cancel");
  return kb;
}

export function cityKeyboard(cities: ApiCity[]): InlineKeyboard {
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
    kb.text(c.name, `city:${c.id}`);
  });
  kb.row().text(i18n.bot.cancel, "action:cancel");
  return kb;
}

export function vacancyCountKeyboard(bundles: ApiVacancyType[] = []): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (let n = 1; n <= 3; n++) {
    const bundle = bundles.find((b) => b.vacancyCount === n);
    const label = bundle
      ? `${n} (${formatAmountUah(bundle.price)})`
      : String(n);
    kb.text(label, `vacancy_count:${n}`);
  }
  kb.row().text(i18n.bot.cancel, "action:cancel");
  return kb;
}

export function yesNoKeyboard(yesData: string, noData: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.common.yes, yesData)
    .text(i18n.common.no, noData);
}

export function skipActionKeyboard(action: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.skip, action)
    .row()
    .text(i18n.bot.cancel, "action:cancel");
}

export function previewKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.edit, "action:edit_menu")
    .row()
    .text(i18n.bot.confirmPay, "action:confirm")
    .row()
    .text(i18n.bot.back, "action:preview_back");
}

export function editMenuKeyboard(listingId?: string): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text("🏙 Місто", "edit:city")
    .text("🏨 Заклад", "edit:venue")
    .row()
    .text("💼 Вакансії", "edit:vacancies")
    .text("✨ Переваги", "edit:benefits")
    .row()
    .text("☎️ Контакт", "edit:contact")
    .row()
    .text("🎞 Фото", "edit:photo")
    .text("📌 Закріплення", "edit:pin")
    .row()
    .text("📅 Час публікації", "edit:schedule")
    .text("🔁 Дублювання", "edit:daily")
    .row();
  if (listingId) {
    kb.text("👁 Перегляд", "action:preview");
    kb.row().text(i18n.bot.myListingsBack, `my:${listingId}`);
  } else {
    kb.text(i18n.bot.back, "action:preview");
  }
  return kb;
}

export function horecaContactKeyboard(): Keyboard {
  return new Keyboard()
    .requestContact(i18n.bot.sharePhone)
    .resized()
    .oneTime();
}

export function photosDoneKeyboard(photoCount: number): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (photoCount > 0) {
    kb.text(i18n.bot.horeca.photosDone, "action:photos_done");
  }
  kb.row().text(i18n.bot.cancel, "action:cancel");
  return kb;
}

export function cancelKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text(i18n.bot.cancel, "action:cancel");
}

export function myListingsKeyboard(listings: ApiListing[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  listings.forEach((l, i) => {
    const title = (l.title ?? "Без назви").slice(0, 24);
    const st = ((i18n.bot.myListingsStatus as Record<string, string>)[l.status] ?? l.status).slice(0, 12);
    if (i > 0) kb.row();
    kb.text(`${title} · ${st}`, `my:${l.id}`);
  });
  kb.row().text(i18n.bot.myListingsBackMenu, "action:menu");
  return kb;
}

export function listingActionsKeyboard(listing: ApiListing): InlineKeyboard {
  const kb = new InlineKeyboard();
  const st = listing.status;

  if (st === "published" && listing.projectSlug) {
    kb.text(i18n.bot.myListingsView, `my_act:view:${listing.id}`);
  }
  if (["published", "expired", "rejected", "approved"].includes(st)) {
    kb.text(i18n.bot.myListingsResubmit, `my_act:resubmit:${listing.id}`);
  }
  if (st === "pending_payment") {
    kb.text(i18n.bot.paymentPay, `my_act:payment:${listing.id}`);
  }
  kb.row().text(i18n.bot.myListingsEdit, `my_act:edit:${listing.id}`);
  kb.row().text(i18n.bot.myListingsBack, "action:my");
  kb.row().text(i18n.bot.myListingsBackMenu, "action:menu");
  return kb;
}

export function listingPreviewKeyboard(listing: ApiListing): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (["published", "expired", "rejected", "approved"].includes(listing.status)) {
    kb.text(i18n.bot.republish, `my_act:resubmit:${listing.id}`);
  }
  kb.row().text(i18n.bot.myListingsBack, `my:${listing.id}`);
  kb.row().text(i18n.bot.myListingsBackMenu, "action:menu");
  return kb;
}

export function editChannelPreviewKeyboard(listingId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.republish, "action:save_republish")
    .row()
    .text(i18n.bot.back, "action:edit_menu")
    .row()
    .text(i18n.bot.myListingsBack, `my:${listingId}`);
}

export function submittedListingKeyboard(listingId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.checkListingStatus, `my:${listingId}`)
    .row()
    .text(i18n.bot.mainMenu, "action:menu");
}

export function paymentPendingKeyboard(
  listingId: string,
  paymentUrl?: string | null,
): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (paymentUrl) {
    kb.url(i18n.bot.paymentPay, paymentUrl);
  } else {
    kb.text(i18n.bot.paymentPay, `my_act:payment:${listingId}`);
  }
  kb.row()
    .text(i18n.bot.checkListingStatus, `my:${listingId}`)
    .row()
    .text(i18n.bot.mainMenu, "action:menu");
  return kb;
}

export function confirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(i18n.bot.confirm, "action:confirm")
    .row()
    .text(i18n.bot.cancel, "action:cancel");
}

export function contactKeyboard(): Keyboard {
  return new Keyboard()
    .requestContact(i18n.bot.sharePhone)
    .resized()
    .oneTime();
}

/** @deprecated legacy flow */
export function projectKeyboard(projects: ApiProject[]): InlineKeyboard {
  return categoryKeyboard(projects);
}

/** @deprecated legacy flow */
export function skipKeyboard(): InlineKeyboard {
  return cancelKeyboard();
}
