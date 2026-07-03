"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { getUser, clearSession, isLoggedIn } from "@/lib/auth";

const NAV = [
  { href: "/account", label: "Огляд", icon: "📊", exact: true },
  { href: "/account/listings", label: "Мої оголошення", icon: "📋" },
  { href: "/account/settings", label: "Профіль", icon: "👤" },
];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?from=/account");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = getUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 flex h-screen flex-col border-r border-slate-200/80 bg-white px-4 py-6">
            <Link href="/account" className="mb-8 flex items-center gap-2 px-2">
              <BrandLogo height={36} />
              <span className="font-bold text-slate-900">Кабінет</span>
            </Link>

            <nav className="flex flex-1 flex-col gap-1">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-brand/10 text-brand"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-100 pt-4">
              <p className="truncate px-2 text-sm font-medium text-slate-900">
                {user?.name ?? "Користувач"}
              </p>
              <p className="truncate px-2 text-xs text-slate-500">{user?.phone}</p>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  window.location.href = "/";
                }}
                className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Вийти
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/account" className="font-bold text-slate-900">
                Кабінет
              </Link>
              <Link href="/create" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white">
                + Оголошення
              </Link>
            </div>
            <nav className="mt-3 flex gap-1 overflow-x-auto">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      active ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
