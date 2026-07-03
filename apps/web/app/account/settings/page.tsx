"use client";

import { getUser } from "@/lib/auth";

export default function AccountSettingsPage() {
  const user = getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Профіль</h1>
        <p className="mt-1 text-slate-500">Ваші облікові дані</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Основна інформація</h2>
        </div>
        <dl className="divide-y divide-slate-50 px-6">
          <div className="flex justify-between py-4">
            <dt className="text-sm text-slate-500">Ім&apos;я</dt>
            <dd className="text-sm font-medium text-slate-900">
              {user?.name ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between py-4">
            <dt className="text-sm text-slate-500">Телефон</dt>
            <dd className="text-sm font-medium text-slate-900">
              {user?.phone ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between py-4">
            <dt className="text-sm text-slate-500">Telegram</dt>
            <dd className="text-sm font-medium text-slate-900">
              {user?.telegramId ? (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  ✓ Підключено
                </span>
              ) : (
                <span className="text-slate-400">Не підключено</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between py-4">
            <dt className="text-sm text-slate-500">Верифікація</dt>
            <dd className="text-sm font-medium text-slate-900">
              {user?.phoneVerified ? (
                <span className="text-emerald-600">Підтверджено</span>
              ) : (
                <span className="text-amber-600">Очікує</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <p className="text-sm text-slate-600">
          Для зміни номера або імені зверніться до підтримки або оновіть дані через
          Telegram-бота.
        </p>
      </div>
    </div>
  );
}
