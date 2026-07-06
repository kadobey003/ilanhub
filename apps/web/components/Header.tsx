"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";
import { getUser, isLoggedIn, clearSession } from "@/lib/auth";

const NAV = [
  { href: "/robota", label: "Шукаю роботу" },
  { href: "/robota/employer", label: "Шукаю працівників" },
  { href: "/horeca", label: "Horeca" },
  { href: "/avto", label: "Авто" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUserName(getUser()?.name ?? null);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        <Link href={loggedIn ? "/account" : "/"} className="flex items-center">
          <BrandLogo height={28} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {loggedIn ? (
            <>
              <Button href="/account" variant="ghost" size="sm">
                {userName ? `👤 ${userName}` : "Кабінет"}
              </Button>
              <Button href="/create" size="sm">
                Подати оголошення
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">
                Увійти
              </Button>
              <Button href="/register" variant="outline" size="sm">
                Реєстрація
              </Button>
              <Button href="/create" size="sm">
                Подати оголошення
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {loggedIn ? (
            <Link
              href="/account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm"
              aria-label="Кабінет"
            >
              👤
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand"
            >
              Увійти
            </Link>
          )}
        </div>

        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 lg:flex"
          onClick={() => setOpen(!open)}
          aria-label="Меню"
        >
          <span className="text-xl">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
            {loggedIn ? (
              <>
                <Button href="/account" variant="outline" size="md" className="w-full">
                  Кабінет
                </Button>
                <Button href="/create" size="md" className="w-full">
                  Подати оголошення
                </Button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-red-600"
                  onClick={() => {
                    clearSession();
                    window.location.href = "/";
                  }}
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <Button href="/login" variant="outline" size="md" className="w-full">
                  Увійти
                </Button>
                <Button href="/register" variant="outline" size="md" className="w-full">
                  Реєстрація
                </Button>
                <Button href="/create" size="md" className="w-full">
                  Подати оголошення
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
