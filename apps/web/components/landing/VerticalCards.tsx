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
    description: "Окремий напрям: кухарі, бармени, офіціанти.",
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

function CardContent({ card }: { card: (typeof cards)[number] }) {
  return (
    <>
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.04] md:opacity-0 md:transition md:group-hover:opacity-[0.06]`}
      />
      <div className="relative flex h-full flex-col">
        {card.badge && (
          <span className="mb-2 inline-block w-fit rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            {card.badge}
          </span>
        )}
        <div className="flex items-start justify-between">
          <span className="text-3xl sm:text-4xl">{card.emoji}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 md:hidden">
            →
          </span>
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {card.subtitle}
        </p>
        <h3 className="mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">{card.title}</h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
          {card.description}
        </p>
        <span className="mt-3 hidden items-center gap-1 text-sm font-semibold text-brand transition-all group-hover:gap-2 sm:inline-flex">
          {card.cta} →
        </span>
      </div>
    </>
  );
}

export function VerticalCards() {
  return (
    <>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x-mandatory md:hidden">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative w-[78vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-5 shadow-md shadow-slate-200/50 active:scale-[0.98] transition-transform"
          >
            <CardContent card={card} />
          </Link>
        ))}
      </div>

      <div className="hidden gap-5 md:grid md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/50"
          >
            <CardContent card={card} />
          </Link>
        ))}
      </div>
    </>
  );
}

export function StatsBar() {
  const stats = [
    { value: "3", label: "Напрями", icon: "📂" },
    { value: "6+", label: "Міст", icon: "🏙️" },
    { value: "5", label: "Каналів", icon: "📡" },
    { value: "24/7", label: "Боти", icon: "🤖" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-100/80 bg-white p-3 shadow-sm sm:gap-4 sm:p-6 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <span className="text-base sm:hidden">{s.icon}</span>
          <p className="text-lg font-bold text-brand sm:text-3xl">{s.value}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-sm">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export function CompareNote() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <h3 className="font-bold text-amber-900 text-base sm:text-lg">
            Horeca ≠ Загальна робота
          </h3>
          <p className="mt-2 text-amber-800/90 text-xs leading-relaxed sm:text-base">
            <strong>Робота</strong> — усі сектори.{" "}
            <strong>Horeca</strong> — лише ресторани, кафе, бари та готелі.
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button href="/robota" variant="outline" size="sm" className="flex-1 !rounded-xl">
          Робота
        </Button>
        <Button href="/horeca" size="sm" className="flex-1 !rounded-xl !bg-amber-500 hover:!bg-amber-600">
          Horeca
        </Button>
      </div>
    </div>
  );
}
