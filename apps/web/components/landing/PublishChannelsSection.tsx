import Link from "next/link";
import { PUBLISH_PLATFORMS } from "@/lib/social-presence";

const STEPS = [
  { icon: "📝", title: "Подаєте", text: "Сайт, Telegram, Viber або WhatsApp" },
  { icon: "✅", title: "Модерація", text: "Перевірка за 15–30 хвилин" },
  { icon: "🚀", title: "Автопублікація", text: "Усі канали одночасно" },
];

export function PublishChannelsSection() {
  return (
    <section id="publikatsiya" className="px-4 py-6 md:px-0 md:py-10">
      <div className="mb-6 text-center md:mb-8">
        <span className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          Мультиканальність
        </span>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
          Куди потрапить ваше оголошення
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Одне оголошення — п&apos;ять платформ. Після модерації публікуємо
          автоматично.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm"
          >
            {i < STEPS.length - 1 && (
              <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 sm:block">
                →
              </span>
            )}
            <span className="text-2xl">{step.icon}</span>
            <h3 className="mt-2 font-bold text-slate-900">{step.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x-mandatory md:mx-0 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
        {PUBLISH_PLATFORMS.map((p) => (
          <div
            key={p.id}
            className="group relative w-[70vw] max-w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:w-auto md:max-w-none"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-[0.05] transition group-hover:opacity-[0.1]`}
            />
            <div className="relative">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-sm"
                style={{ backgroundColor: `${p.color}18` }}
              >
                {p.icon}
              </div>
              <h3 className="mt-3 font-bold text-slate-900">{p.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {p.description}
              </p>
              <span
                className="mt-3 inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: `${p.color}15`, color: p.color }}
              >
                {p.submitLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-slate-900">
            Подати через будь-який канал — результат однаковий
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Telegram-бот, Viber, WhatsApp або форма на сайті
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
        >
          Подати оголошення →
        </Link>
      </div>
    </section>
  );
}
