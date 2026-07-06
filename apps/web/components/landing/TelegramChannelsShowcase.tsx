import Image from "next/image";
import { telegramBotUrl } from "@ilanhub/shared";
import type { PublicTelegramChannel } from "@/lib/site-api";
import { getProjectMeta } from "@/lib/project-meta";
import { TelegramChannelsCarousel } from "./TelegramChannelsCarousel";

const PROJECT_ACCENT: Record<string, string> = {
  jobs: "from-blue-500 to-indigo-600",
  horeca: "from-amber-400 to-orange-500",
  auto: "from-emerald-500 to-teal-600",
};

function fmtMembers(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("uk-UA", { maximumFractionDigits: 1 })}M`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)}K+`;
  if (n >= 1000) {
    return `${(n / 1000).toLocaleString("uk-UA", { maximumFractionDigits: 1 })}K`;
  }
  return n.toLocaleString("uk-UA");
}

function channelHandle(channelId: string): string | null {
  const raw = channelId.trim();
  if (raw.startsWith("@")) return raw;
  if (/^[a-zA-Z0-9_]{4,}$/.test(raw)) return `@${raw}`;
  return null;
}

function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function ChannelAvatar({
  photoUrl,
  emoji,
  accent,
}: {
  photoUrl: string | null;
  emoji: string;
  accent: string;
}) {
  if (photoUrl) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-md ring-2 ring-white">
        <Image
          src={photoUrl}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xl shadow-md`}
    >
      {emoji}
    </span>
  );
}

function ChannelCard({
  channel,
  rank,
  featured,
  delay,
}: {
  channel: PublicTelegramChannel;
  rank: number;
  featured: boolean;
  delay: number;
}) {
  const meta = getProjectMeta(channel.projectSlug);
  const accent = PROJECT_ACCENT[channel.projectSlug] ?? "from-sky-400 to-blue-500";
  const handle = channelHandle(channel.channelId);
  const scope =
    channel.cities.length > 0 ? channel.cities.join(" · ") : "Вся Україна";

  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay: `${delay}ms` }}
      className={`group relative flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-sky-900/15 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-900/25 active:scale-[0.98] animate-fade-in opacity-0 lg:w-[280px] ${
        featured ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-[#1a8bc4]" : ""
      }`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />

      {featured && (
        <span className="absolute right-3 top-4 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm animate-shimmer">
          ⭐ Топ
        </span>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <ChannelAvatar photoUrl={channel.photoUrl} emoji={meta.emoji} accent={accent} />
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {meta.title}
            </span>
            <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">
              {channel.name}
            </h3>
            {handle && (
              <p className="mt-0.5 truncate text-xs font-medium text-[#229ED9]">
                {handle}
              </p>
            )}
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <span>📍</span>
          <span className="line-clamp-1">{scope}</span>
        </p>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none text-slate-900">
              {fmtMembers(channel.memberCount)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              підписників
            </p>
            {channel.joinedThisWeek != null && channel.joinedThisWeek > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                +{channel.joinedThisWeek.toLocaleString("uk-UA")} цього тижня
              </p>
            )}
          </div>
          {rank <= 3 && channel.memberCount != null && (
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
              #{rank}
            </span>
          )}
        </div>

        <span className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] py-2.5 text-sm font-bold text-white shadow-md shadow-sky-300/40 transition group-hover:bg-[#1a8bc4]">
          <TelegramIcon className="h-4 w-4" />
          Підписатися
        </span>
      </div>
    </a>
  );
}

export function TelegramChannelsShowcase({
  channels,
  totalMembers,
  joinedThisWeek,
  botUsername,
}: {
  channels: PublicTelegramChannel[];
  totalMembers: number;
  joinedThisWeek: number;
  botUsername: string | null;
}) {
  if (!channels.length) return null;

  const sorted = [...channels].sort(
    (a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0),
  );
  const topCount = sorted[0]?.memberCount ?? 0;
  const useMarquee = sorted.length > 3;
  const botUrl = botUsername ? telegramBotUrl(botUsername, "create") : null;

  const cards = sorted.map((ch, i) => (
    <ChannelCard
      key={ch.id}
      channel={ch}
      rank={i + 1}
      featured={i === 0 && topCount > 0}
      delay={i * 80}
    />
  ));

  return (
    <section className="relative overflow-hidden rounded-none bg-gradient-to-br from-[#229ED9] via-[#1a8bc4] to-[#0d5f8a] px-4 py-6 sm:rounded-2xl sm:px-6 sm:py-7 md:rounded-3xl md:py-9">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.06]" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-float" />
      <div className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#229ED9] shadow-lg">
                <TelegramIcon className="h-6 w-6" />
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Безкоштовно
              </span>
              {joinedThisWeek > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/90 px-3 py-1 text-[11px] font-bold text-emerald-950">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-800" />
                  +{joinedThisWeek.toLocaleString("uk-UA")} цього тижня
                </span>
              )}
              {joinedThisWeek <= 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/90 px-3 py-1 text-[11px] font-bold text-emerald-950">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-800" />
                  Щодня нові оголошення
                </span>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Приєднуйтесь до наших каналів
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-sky-100/90 sm:text-base">
              Вакансії, Horeca та авто — прямо у Telegram. Оберіть своє місто
              та підписуйтесь за один клік.
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-center backdrop-blur-md">
              <p className="text-3xl font-extrabold tabular-nums text-white">
                {channels.length}
              </p>
              <p className="text-[11px] font-medium text-sky-100/80">каналів</p>
            </div>
            {totalMembers > 0 && (
              <div className="rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-400/25 to-amber-500/10 px-5 py-3 text-center backdrop-blur-md">
                <p className="text-3xl font-extrabold tabular-nums text-white">
                  {fmtMembers(totalMembers)}+
                </p>
                <p className="text-[11px] font-medium text-amber-100/90">
                  підписників
                </p>
              </div>
            )}
          </div>
        </div>

        <TelegramChannelsCarousel marquee={useMarquee}>
          {cards}
        </TelegramChannelsCarousel>

        {!useMarquee && (
          <p className="mt-3 text-center text-[10px] text-sky-200/60 sm:hidden">
            ← Прокрутіть канали →
          </p>
        )}

        {botUrl && (
          <div className="mt-6 flex justify-center">
            <a
              href={botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-md items-center justify-center gap-2.5 rounded-2xl border-2 border-white/30 bg-white px-5 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-sky-50 active:scale-[0.98] sm:w-auto sm:px-8"
            >
              <span className="text-xl">🤖</span>
              <span>
                Подати оголошення через бота
                <span className="ml-1 font-extrabold text-[#229ED9]">
                  @{botUsername}
                </span>
              </span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
