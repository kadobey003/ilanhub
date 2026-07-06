"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Головна", icon: "🏠", match: (p: string) => p === "/" },
  { href: "/robota", label: "Робота", icon: "💼", match: (p: string) => p.startsWith("/robota") },
  { href: "/create", label: "Подати", icon: "+", fab: true },
  { href: "/horeca", label: "Horeca", icon: "🍽️", match: (p: string) => p.startsWith("/horeca") },
  { href: "/avto", label: "Авто", icon: "🚗", match: (p: string) => p.startsWith("/avto") },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-1.5 pb-1">
        {TABS.map((tab) => {
          if ("fab" in tab && tab.fab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group -mt-5 flex flex-col items-center gap-0.5"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-indigo-600 text-2xl font-light text-white shadow-lg shadow-brand/40 transition active:scale-95">
                  {tab.icon}
                </span>
                <span className="text-[10px] font-semibold text-brand">{tab.label}</span>
              </Link>
            );
          }

          const active = "match" in tab && tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition active:scale-95 ${
                active ? "text-brand" : "text-slate-400"
              }`}
            >
              <span className={`text-xl transition ${active ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
              {active && (
                <span className="h-0.5 w-4 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
