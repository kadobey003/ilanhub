import Link from "next/link";

const BENEFITS = [
  { icon: "👥", title: "50K+ охоплення", text: "Активна аудиторія в Telegram-каналах по містах" },
  { icon: "🎯", title: "Точний таргетинг", text: "Робота, Horeca, авто — реклама потрібній аудиторії" },
  { icon: "📊", title: "Звітність", text: "Перегляди, кліки та конверсії після кампанії" },
  { icon: "⚡", title: "Швидкий старт", text: "Запуск реклами за 24 години після оплати" },
];

export function AdvertiseSection({ contactHref }: { contactHref: string }) {
  return (
    <section className="px-4 py-6 md:px-0 md:py-10">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-5 py-10 text-white sm:px-10 sm:py-14">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-sm">
              Для бізнесу
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl text-balance">
              Рекламуйте бренд на UAREKLAMHUB
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Банери, спонсорські пости, VIP-розміщення та партнерські кампанії.
              Доступ до аудиторії, яка шукає роботу, персонал і товари щодня.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href={contactHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 px-6 py-3 text-sm font-bold text-slate-900 transition hover:from-amber-300 hover:to-amber-200"
              >
                Замовити рекламу
              </Link>
              <Link
                href="#pakety"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Переглянути тарифи
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <span className="text-2xl">{b.icon}</span>
                <h3 className="mt-2 text-sm font-bold">{b.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
