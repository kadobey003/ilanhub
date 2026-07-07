import Link from "next/link";
import { BRAND_NAME, telegramBotUrl } from "@ilanhub/shared";
import { BrandLogo } from "@/components/BrandLogo";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
const botUrl = BOT_USERNAME ? telegramBotUrl(BOT_USERNAME) : null;

const LINKS = {
  Робота: [
    { href: "/robota", label: "Шукаю роботу" },
    { href: "/robota/employer", label: "Для роботодавців" },
    { href: "/jobs", label: "Вакансії" },
    { href: "/horeca", label: "Horeca" },
  ],
  Авто: [{ href: "/avto", label: "Продати авто" }],
  Акаунт: [
    { href: "/login", label: "Увійти" },
    { href: "/register", label: "Реєстрація" },
    { href: "/create", label: "Подати оголошення" },
  ],
  Реклама: [
    { href: "/#pakety", label: "Тарифи VIP" },
    { href: "/#reklama", label: "Рекламні місця" },
    { href: "/#kampaniyi", label: "Кампанії" },
  ],
  Канали: [
    { href: "/#telegram", label: "Telegram" },
    { href: "/#nashi-kanaly", label: "Instagram та ін." },
    { href: "/#publikatsiya", label: "Де публікуємо" },
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
              Платформа оголошень для України. Telegram, Viber, WhatsApp, Instagram та веб.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {botUrl && (
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#229ED9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a8bc4]"
                >
                  ✈️ Telegram
                </a>
              )}
              <a
                href="/#nashi-kanaly"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                📸 Instagram
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#7360F2] px-3 py-1.5 text-xs font-semibold text-white">
                💜 Viber
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">
                💬 WhatsApp
              </span>
            </div>
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
