"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { accountApi, type UserListing } from "@/lib/account-api";
import { formatDate, formatPrice, STATUS_LABELS } from "@/lib/listing-status";

export default function AccountListingsPage() {
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    accountApi
      .listings()
      .then((res) => setListings(res.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Помилка"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Мої оголошення</h1>
          <p className="mt-1 text-slate-500">
            {listings.length > 0
              ? `${listings.length} оголошень`
              : "Керуйте всіма вашими публікаціями"}
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
        >
          + Нове
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-4 font-medium text-slate-900">Ще немає оголошень</p>
          <p className="mt-1 text-sm text-slate-500">
            Створіть перше — воно з&apos;явиться тут після збереження
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Подати оголошення
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => {
            const st = STATUS_LABELS[item.status] ?? {
              label: item.status,
              color: "bg-slate-100 text-slate-600",
            };
            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl">
                  📄
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {item.title ?? "Без назви"}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {item.project} · Створено {formatDate(item.createdAt)}
                    {item.publishedAt && ` · Опубліковано ${formatDate(item.publishedAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <p className="text-lg font-bold text-slate-900">
                    {formatPrice(item.price, item.currency)}
                  </p>
                  {item.status === "published" && (
                    <Link
                      href={`/${item.projectSlug}/listing/${item.id}`}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      Переглянути →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
