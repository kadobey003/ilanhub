export type AdminListingEvent =
  | "submitted_payment"
  | "submitted_moderation"
  | "payment_received"
  | "resubmitted";

const STATUS_UK: Record<string, string> = {
  draft: "Чернетка",
  pending_payment: "Очікує оплати",
  pending_moderation: "На модерації",
  approved: "Схвалено",
  publishing: "Публікація",
  published: "Опубліковано",
  rejected: "Відхилено",
  expired: "Завершено",
};

export function statusLabelUk(status: string): string {
  return STATUS_UK[status] ?? status;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type AdminListingSnapshot = {
  id: string;
  title: string | null;
  status: string;
  price: number | null;
  projectName: string;
  cityName: string | null;
  contactPhone: string | null;
  sourceChannel: string | null;
  userName: string | null;
  userTelegramId: string | null;
  paymentStatus: "none" | "pending" | "completed";
  paymentAmount: number | null;
  paymentMethod: string | null;
};

export function shortListingId(id: string): string {
  return id.slice(0, 8);
}

export function buildAdminListingNotifyMessage(
  event: AdminListingEvent,
  listing: AdminListingSnapshot,
): string {
  const sid = shortListingId(listing.id);
  const title = esc(listing.title?.trim() || "Без назви");
  const price =
    listing.price != null && listing.price > 0
      ? `${listing.price} ₴`
      : "безкоштовно";

  const payLine =
    listing.price != null && listing.price > 0
      ? listing.paymentStatus === "completed"
        ? `💳 <b>Оплата:</b> ✅ Оплачено (${price})`
        : listing.paymentStatus === "pending"
          ? `💳 <b>Оплата:</b> ⏳ Очікує (${price})`
          : `💳 <b>Оплата:</b> ❌ Не оплачено (${price})`
      : `💳 <b>Оплата:</b> не потрібна`;

  const header =
    event === "payment_received"
      ? "💰 ОПЛАТУ ОТРИМАНО"
      : event === "resubmitted"
        ? "🔄 ПОВТОРНА МОДЕРАЦІЯ"
        : event === "submitted_payment"
          ? "🆕 НОВЕ ОГОЛОШЕННЯ — ОЧІКУЄ ОПЛАТИ"
          : "🆕 НОВЕ ОГОЛОШЕННЯ — НА МОДЕРАЦІЮ";

  const channel = listing.sourceChannel
    ? listing.sourceChannel.charAt(0).toUpperCase() + listing.sourceChannel.slice(1)
    : "—";

  const lines = [
    `<b>${header}</b>`,
    "",
    `📄 <b>${title}</b>`,
    `🆔 <code>${sid}</code>`,
    `📊 <b>Статус:</b> ${statusLabelUk(listing.status)}`,
    payLine,
    `📁 ${esc(listing.projectName)}${listing.cityName ? ` · ${esc(listing.cityName)}` : ""}`,
    `📣 <b>Канал:</b> ${channel}`,
  ];

  if (listing.userName) lines.push(`👤 ${esc(listing.userName)}`);
  if (listing.userTelegramId) {
    lines.push(`💬 Telegram ID: <code>${listing.userTelegramId}</code>`);
  }
  if (listing.contactPhone) {
    lines.push(`📱 ${esc(listing.contactPhone)}`);
  }

  lines.push(
    "",
    event === "submitted_payment"
      ? "⏳ Після оплати оголошення автоматично піде на модерацію."
      : "⚡ <b>Команди:</b> /onayla /reddet /ilan /odeme",
  );

  return lines.join("\n");
}

export function adminListingInlineKeyboard(listingId: string) {
  const sid = shortListingId(listingId);
  return {
    inline_keyboard: [
      [
        { text: "✅ Схвалити", callback_data: `adm:approve:${sid}` },
        { text: "❌ Відхилити", callback_data: `adm:reject:${sid}` },
      ],
      [
        { text: "📋 Деталі", callback_data: `adm:info:${sid}` },
        { text: "💳 Оплата", callback_data: `adm:pay:${sid}` },
      ],
    ],
  };
}

export function buildAdminListingDetailMessage(
  listing: AdminListingSnapshot,
): string {
  const sid = shortListingId(listing.id);
  const title = esc(listing.title?.trim() || "Без назви");
  const payLine =
    listing.paymentStatus === "completed"
      ? `✅ Оплачено${listing.paymentAmount ? ` — ${listing.paymentAmount} ₴` : ""}`
      : listing.paymentStatus === "pending"
        ? `⏳ Очікує${listing.paymentAmount ? ` — ${listing.paymentAmount} ₴` : ""}`
        : listing.price && listing.price > 0
          ? `❌ Не оплачено — ${listing.price} ₴`
          : "—";

  return [
    `<b>📋 Оголошення</b>`,
    "",
    `📄 <b>${title}</b>`,
    `🆔 <code>${sid}</code>`,
    `📊 ${statusLabelUk(listing.status)}`,
    `💳 ${payLine}${listing.paymentMethod ? ` (${listing.paymentMethod})` : ""}`,
    `📁 ${esc(listing.projectName)}${listing.cityName ? ` · ${esc(listing.cityName)}` : ""}`,
    listing.contactPhone ? `📱 ${esc(listing.contactPhone)}` : "",
    "",
    `<b>Команди:</b>`,
    `/onayla ${sid}`,
    `/reddet ${sid} причина`,
    `/odeme ${sid}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAdminPendingListMessage(
  rows: Array<{ id: string; title: string | null; status: string; price: number | null }>,
): string {
  if (!rows.length) {
    return "✅ Немає оголошень на модерації.";
  }
  const lines = [`<b>📥 На модерації (${rows.length})</b>`, ""];
  for (const row of rows.slice(0, 15)) {
    const sid = shortListingId(row.id);
    const title = esc((row.title ?? "Без назви").slice(0, 40));
    const price =
      row.price != null && row.price > 0 ? ` · ${row.price} ₴` : "";
    lines.push(`• <code>${sid}</code> ${title}${price}`);
  }
  if (rows.length > 15) {
    lines.push(`\n… ще ${rows.length - 15}`);
  }
  lines.push("", "Схвалити: <code>/onayla ID</code>");
  return lines.join("\n");
}

export function buildAdminHelpMessage(): string {
  return [
    "<b>🛡 Адмін-команди UAREKLAMHUB</b>",
    "",
    "<b>Модерація</b>",
    "/onayla <code>ID</code> — схвалити",
    "/reddet <code>ID</code> причина — відхилити",
    "/bekleyen — список на модерації",
    "",
    "<b>Перегляд</b>",
    "/ilan <code>ID</code> — деталі оголошення",
    "/odeme <code>ID</code> — статус оплати",
    "/stat — коротка статистика",
    "",
    "<i>ID — перші 8 символів UUID (напр. 2b89dfc5)</i>",
  ].join("\n");
}
