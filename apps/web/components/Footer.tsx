import Link from "next/link";
import { BRAND_NAME } from "@ilanhub/shared";
import { BrandLogo } from "@/components/BrandLogo";

const LINKS = {
  Робота: [
    { href: "/robota", label: "Шукаю роботу" },
    { href: "/robota/employer", label: "Для роботодавців" },
    { href: "/horeca", label: "Horeca" },
  ],
  Авто: [{ href: "/avto", label: "Продати авто" }],
  Акаунт: [
    { href: "/login", label: "Увійти" },
    { href: "/register", label: "Реєстрація" },
    { href: "/create", label: "Подати оголошення" },
  ],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex">
              <BrandLogo height={28} />
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              Платформа оголошень для України. Telegram, Viber, WhatsApp та веб.
            </p>
          </div>
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold text-slate-900">{title}</h4>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 hover:text-brand transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} {BRAND_NAME} — Всі права захищені
        </div>
      </div>
    </footer>
  );
}
