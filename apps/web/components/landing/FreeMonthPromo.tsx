"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { daysUntilPromoEnd } from "@/lib/landing-promos";

const PERKS = [
  { icon: "💼", label: "Вакансії" },
  { icon: "🍽️", label: "Horeca" },
  { icon: "🚗", label: "Авто" },
  { icon: "📱", label: "Telegram + сайт" },
];

export function FreeMonthPromo({
  endsAt,
  endsLabel,
  title,
  subtitle,
  cta,
  href,
}: {
  endsAt: string;
  endsLabel: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
}) {
  const [daysLeft, setDaysLeft] = useState(() => daysUntilPromoEnd(endsAt));

  useEffect(() => {
    const tick = () => setDaysLeft(daysUntilPromoEnd(endsAt));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <section
      id="bezplatno"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-5 py-8 text-white shadow-xl shadow-emerald-900/20 sm:px-10 sm:py-12"
    >
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-yellow-300/15 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              🎁 Спеціальна акція
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-950">
              до {endsLabel}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-4xl text-balance">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-50/90 sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {PERKS.map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:text-sm"
              >
                <span>{p.icon}</span>
                {p.label}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={href}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 sm:text-base"
            >
              {cta} →
            </Link>
            <p className="text-xs text-emerald-100/80 sm:text-sm">
              Без прихованих платежів · Модерація як завжди
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-8 py-6 backdrop-blur-sm lg:min-w-[200px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/70">
            Залишилось
          </p>
          <p className="mt-1 text-6xl font-black tabular-nums leading-none sm:text-7xl">
            {daysLeft}
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-100">
            {daysLeft === 1 ? "день" : daysLeft < 5 ? "дні" : "днів"}
          </p>
          <div className="mt-4 text-center">
            <p className="text-4xl font-black">0 ₴</p>
            <p className="mt-0.5 text-xs text-emerald-100/80">базова публікація</p>
          </div>
        </div>
      </div>
    </section>
  );
}
