export type ModerationNotifyAction =
  | "approve"
  | "reject"
  | "cancel"
  | "payment_confirmed"
  | "republish";

function quoteTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 80) return `«${t}»`;
  return `«${t.slice(0, 77)}…»`;
}

function noteBlock(note?: string | null): string {
  const n = note?.trim();
  if (!n) return "";
  return `\n\n💬 Коментар модератора:\n${n}`;
}

export function buildModerationMessage(
  action: ModerationNotifyAction,
  listingTitle: string,
  note?: string | null,
): string {
  const title = quoteTitle(listingTitle);

  switch (action) {
    case "approve":
      return (
        `✅ Оголошення схвалено!\n\n` +
        `${title}\n\n` +
        `Ваша заявка пройшла модерацію. Оголошення незабаром буде опубліковано на обраних каналах.` +
        noteBlock(note) +
        `\n\nДякуємо, що користуєтесь İlanHub!`
      );

    case "reject":
      return (
        `❌ Оголошення не схвалено\n\n` +
        `${title}\n\n` +
        `На жаль, ваше оголошення не пройшло модерацію.` +
        (note?.trim()
          ? `\n\n📋 Причина:\n${note.trim()}`
          : `\n\n📋 Причину не вказано. Зверніться до підтримки, якщо потрібні деталі.`) +
        `\n\nВи можете створити нове оголошення або звʼязатися з нами для уточнень.\n\nДякуємо за розуміння!`
      );

    case "cancel":
      return (
        `⚠️ Оголошення скасовано\n\n` +
        `${title}\n\n` +
        `Ваше оголошення було скасовано адміністратором.` +
        noteBlock(note) +
        `\n\nЗвертайтеся до нас, якщо потрібна допомога.`
      );

    case "payment_confirmed":
      return (
        `✅ Оплату підтверджено\n\n` +
        `${title}\n\n` +
        `Ми отримали підтвердження оплати. Оголошення передано на модерацію — результат повідомимо найближчим часом.` +
        noteBlock(note) +
        `\n\nДякуємо!`
      );

    case "republish":
      return (
        `📢 Публікація розпочата\n\n` +
        `${title}\n\n` +
        `Ваше оголошення поставлено в чергу на публікацію. Невдовзі воно з'явиться на обраних каналах.` +
        noteBlock(note) +
        `\n\nДякуємо за терпіння!`
      );
  }
}
