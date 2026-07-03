"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accountApi, type DashboardData } from "@/lib/account-api";
import { formatDate, formatPrice, STATUS_LABELS } from "@/lib/listing-status";
import { getUser } from "@/lib/auth";

export default function AccountDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const user = getUser();

  useEffect(() => {
    accountApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Помилка"));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  const { stats, recent } = data;
  const name = user?.name ?? data.user.name ?? "Користувач";

  const statCards = [
    { label: "Всього", value: stats.total, icon: "📋", color: "from-blue-500 to-blue-600" },
    { label: "Опубліковано", value: stats.published, icon: "✅", color: "from-emerald-500 to-emerald-600" },
    { label: "В обробці", value: stats.pending, icon: "⏳", color: "from-amber-500 to-amber-600" },
    { label: "Чернетки", value: stats.draft, icon: "📝", color: "from-slate-500 to-slate-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">Особистий кабінет</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Вітаємо, {name}!
          </h1>
          <p className="mt-1 text-slate-500">Керуйте оголошеннями в одному місці</p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
        >
          + Нове оголошення
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${card.color} opacity-10`}
            />
            <span className="text-2xl">{card.icon}</span>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">Останні оголошення</h2>
            <Link href="/account/listings" className="text-sm font-medium text-brand hover:underline">
              Усі →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">У вас ще немає оголошень</p>
              <Link
                href="/create"
                className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
              >
                Створити перше →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recent.map((item) => {
                const st = STATUS_LABELS[item.status] ?? {
                  label: item.status,
                  color: "bg-slate-100 text-slate-600",
                };
                return (
                  <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                      📄
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {item.title ?? "Без назви"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.project} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatPrice(item.price, item.currency)}
                      </p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-lg shadow-brand/20">
          <h2 className="text-lg font-semibold">Швидкі дії</h2>
          <p className="mt-1 text-sm text-white/80">Що хочете зробити?</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/create"
              className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/25"
            >
              📢 Подати оголошення
            </Link>
            <Link
              href="/account/listings"
              className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/25"
            >
              📋 Мої оголошення
            </Link>
            <Link
              href="/account/settings"
              className="rounded-xl bg-white/15 px-4 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/25"
            >
              ⚙️ Налаштування профілю
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
