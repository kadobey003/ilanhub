"use client";

import type { BrowseTelegramChannel } from "@/lib/listings-types";
import { telegramBotUrl } from "@ilanhub/shared";

interface Props {
  channels: BrowseTelegramChannel[];
  botUsername: string | null;
  cityName?: string;
}

export function TelegramBrowseBanner({ channels, botUsername, cityName }: Props) {
  if (!channels.length && !botUsername) return null;

  const botUrl = botUsername ? telegramBotUrl(botUsername) : null;

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#229ED9] text-xl text-white shadow-md shadow-sky-300/50">
          ✈️
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">
            Перевірте також у Telegram
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {cityName
              ? `Актуальні оголошення у ${cityName} — у каналі та боті`
              : "Нові вакансії щодня в каналі та боті"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {channels.map((ch) => (
              <a
                key={ch.url}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#229ED9] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a8bc4] active:scale-[0.98]"
              >
                <span>📢</span>
                {ch.name.startsWith("@") ? ch.name : ch.name || "Канал"}
              </a>
            ))}
            {botUrl && (
              <a
                href={botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#229ED9]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#229ED9] transition hover:bg-sky-50 active:scale-[0.98]"
              >
                🤖 Бот @{botUsername}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
