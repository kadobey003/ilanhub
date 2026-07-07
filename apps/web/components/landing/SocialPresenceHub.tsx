"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { telegramBotUrl } from "@ilanhub/shared";
import type { PublicSocialChannel, SocialBots, SocialChannelType } from "@/lib/site-api";
import { getProjectMeta } from "@/lib/project-meta";

const TABS: {
  id: SocialChannelType;
  label: string;
  icon: string;
  color: string;
  cta: string;
}[] = [
  { id: "telegram", label: "Telegram", icon: "✈️", color: "#229ED9", cta: "Підписатися" },
  { id: "instagram", label: "Instagram", icon: "📸", color: "#E4405F", cta: "Стежити" },
  { id: "viber", label: "Viber", icon: "💜", color: "#7360F2", cta: "Відкрити" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366", cta: "Написати" },
  { id: "web", label: "Сайт", icon: "🌐", color: "#2563eb", cta: "Перейти" },
];

const PROJECT_ACCENT: Record<string, string> = {
  jobs: "from-blue-500 to-indigo-600",
  horeca: "from-amber-400 to-orange-500",
  auto: "from-emerald-500 to-teal-600",
};

function fmtMembers(n: number | null): string {
  if (n == null) return "";
  if (n >= 10_000) return `${Math.round(n / 1000)}K+`;
  if (n >= 1000) return `${(n / 1000).toLocaleString("uk-UA", { maximumFractionDigits: 1 })}K`;
  return n.toLocaleString("uk-UA");
}

function SocialCard({
  item,
  cta,
  accent,
}: {
  item: PublicSocialChannel;
  cta: string;
  accent: string;
}) {
  const meta = getProjectMeta(item.projectSlug);
  const scope = item.cities.length > 0 ? item.cities.join(" · ") : "Вся Україна";
  const external = item.url.startsWith("http");

  const inner = (
    <>
      <div className={`h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          {item.photoUrl ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-md ring-2 ring-white">
              <Image
                src={item.photoUrl}
                alt=""
                width={44}
                height={44}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xl shadow-md`}
            >
              {meta.emoji}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {item.projectName}
            </span>
            <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">
              {item.name}
            </h3>
            {item.handle && (
              <p className="mt-0.5 truncate text-xs font-medium text-brand">{item.handle}</p>
            )}
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <span>📍</span>
          <span className="line-clamp-1">{scope}</span>
        </p>
        {item.memberCount != null && item.memberCount > 0 && (
          <p className="mt-2 text-sm font-bold text-slate-900">
            {fmtMembers(item.memberCount)} підписників
          </p>
        )}
        <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition group-hover:bg-slate-800">
          {cta} →
        </span>
      </div>
    </>
  );

  const cls =
    "group flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-xl md:w-auto md:max-w-none";

  if (external) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={item.url} className={cls}>
      {inner}
    </Link>
  );
}

function BotStrip({ bots }: { bots: SocialBots }) {
  const items = [
    bots.telegram?.url && {
      label: "Telegram бот",
      icon: "✈️",
      href: bots.telegram.url,
      sub: `@${bots.telegram.username}`,
      color: "bg-[#229ED9]",
    },
    bots.viber?.url && {
      label: bots.viber.name,
      icon: "💜",
      href: bots.viber.url,
      sub: "Подати оголошення",
      color: "bg-[#7360F2]",
    },
    bots.whatsapp?.url && {
      label: bots.whatsapp.name,
      icon: "💬",
      href: bots.whatsapp.url,
      sub: "Подати оголошення",
      color: "bg-[#25D366]",
    },
  ].filter(Boolean) as {
    label: string;
    icon: string;
    href: string;
    sub: string;
    color: string;
  }[];

  if (!items.length) return null;

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
        Подати оголошення через ботів
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span
              className={`inline-flex items-center gap-2 rounded-xl ${item.color} px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90`}
            >
              <span>{item.icon}</span>
              <span>
                {item.label}
                <span className="ml-1 block text-[10px] font-medium opacity-80">
                  {item.sub}
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function SocialPresenceHub({
  presence,
  bots,
  botUsername,
}: {
  presence: Record<SocialChannelType, PublicSocialChannel[]>;
  bots: SocialBots;
  botUsername: string | null;
}) {
  const resolvedBots = useMemo(() => {
    if (bots.telegram || !botUsername) return bots;
    return {
      ...bots,
      telegram: { username: botUsername, url: telegramBotUrl(botUsername, "create") },
    };
  }, [bots, botUsername]);

  const activeTabs = useMemo(
    () => TABS.filter((t) => presence[t.id].length > 0),
    [presence],
  );

  const totalCount = activeTabs.reduce((n, t) => n + presence[t.id].length, 0);
  const hasBots =
    Boolean(resolvedBots.telegram?.url) ||
    Boolean(resolvedBots.viber?.url) ||
    Boolean(resolvedBots.whatsapp?.url);

  const [tab, setTab] = useState<SocialChannelType>("telegram");

  useEffect(() => {
    if (activeTabs.length > 0 && !activeTabs.some((t) => t.id === tab)) {
      setTab(activeTabs[0]!.id);
    }
  }, [activeTabs, tab]);

  if (totalCount === 0 && !hasBots) return null;

  const activeTab = activeTabs.find((t) => t.id === tab) ?? activeTabs[0];
  const items = activeTab ? presence[activeTab.id] : [];

  return (
    <section id="nashi-kanaly" className="px-4 py-6 md:px-0 md:py-10">
      <div className="mb-5 text-center md:mb-8">
        <span className="mb-2 inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
          Наша присутність
        </span>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
          Канали, сторінки та боти
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Telegram-канали, Instagram-сторінки, Viber, WhatsApp та сайт — підписуйтесь
          або подавайте оголошення.
        </p>
        {totalCount > 0 && (
          <p className="mt-2 text-sm font-semibold text-brand">
            {totalCount} активних майданчиків
          </p>
        )}
      </div>

      {activeTabs.length > 0 && (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0">
            {activeTabs.map((t) => {
              const count = presence[t.id].length;
              const active = activeTab?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "text-white shadow-lg"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                  style={active ? { backgroundColor: t.color } : undefined}
                >
                  <span>{t.icon}</span>
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-white/25" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x-mandatory md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3">
              {items.map((item) => (
                <SocialCard
                  key={item.id}
                  item={item}
                  cta={activeTab!.cta}
                  accent={PROJECT_ACCENT[item.projectSlug] ?? "from-sky-400 to-blue-500"}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <BotStrip bots={resolvedBots} />
    </section>
  );
}
