import Link from "next/link";
import { Button } from "@/components/ui/Button";

const cards = [
  {
    href: "/robota",
    emoji: "🔍",
    title: "Шукаю роботу",
    subtitle: "Для кандидатів",
    description: "Офіс, IT, виробництво, логістика — знайдіть вакансію у своєму місті.",
    gradient: "from-blue-500 to-indigo-600",
    cta: "Переглянути вакансії",
  },
  {
    href: "/robota/employer",
    emoji: "🏢",
    title: "Шукаю працівників",
    subtitle: "Для роботодавців",
    description: "Опублікуйте вакансію — Telegram, Viber, WhatsApp та сайт автоматично.",
    gradient: "from-violet-500 to-purple-700",
    cta: "Подати вакансію",
  },
  {
    href: "/horeca",
    emoji: "🍽️",
    title: "Horeca",
    subtitle: "Ресторани та готелі",
    description: "Окремий напрям: кухарі, бармени, офіціанти. Не плутайте з загальною роботою.",
    gradient: "from-amber-500 to-orange-600",
    cta: "Відкрити Horeca",
    badge: "Окремий vertical",
  },
  {
    href: "/avto",
    emoji: "🚗",
    title: "Продаю авто",
    subtitle: "Автомобілі",
    description: "Легкові, вантажні, мото. Швидкий продаж по всій Україні.",
    gradient: "from-emerald-500 to-teal-600",
    cta: "Подати оголошення",
  },
];

export function VerticalCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition group-hover:opacity-[0.03]`}
          />
          <div className="relative">
            {card.badge && (
              <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800">
                {card.badge}
              </span>
            )}
            <span className="text-4xl">{card.emoji}</span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {card.subtitle}
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {card.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand group-hover:gap-2 transition-all">
              {card.cta} →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function StatsBar() {
  const stats = [
    { value: "3", label: "Напрями" },
    { value: "6+", label: "Міст" },
    { value: "5", label: "Каналів" },
    { value: "24/7", label: "Боти" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="text-2xl font-bold text-brand sm:text-3xl">{s.value}</p>
          <p className="mt-1 text-sm text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export function CompareNote() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <h3 className="font-bold text-amber-900 text-lg">
        Horeca ≠ Загальна робота
      </h3>
      <p className="mt-2 text-amber-800/90 text-sm leading-relaxed sm:text-base">
        <strong>Робота</strong> — усі сектори: офіс, IT, склад, будівництво.{" "}
        <strong>Horeca</strong> — лише ресторани, кафе, бари та готелі. Окремі
        категорії, канали та аудиторія.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button href="/robota" variant="outline" size="sm">
          Загальна робота
        </Button>
        <Button href="/horeca" size="sm" className="!bg-amber-500 hover:!bg-amber-600">
          Horeca
        </Button>
      </div>
    </div>
  );
}
