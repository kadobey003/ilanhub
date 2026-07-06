import { HomeRedirect } from "@/components/HomeRedirect";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CTASection } from "@/components/landing/CTASection";
import {
  VerticalCards,
  StatsBar,
  CompareNote,
} from "@/components/landing/VerticalCards";

export default function HomePage() {
  return (
    <div className="md:mx-auto md:max-w-6xl md:px-6">
      <HomeRedirect />

      <div className="animate-fade-in md:py-12">
        <Hero
          badge="🇺🇦 Платформа для України"
          title="Оголошення, які"
          highlight="працюють на вас"
          subtitle="Робота, Horeca, авто — одне місце для пошуку та публікації. Telegram, Viber, WhatsApp і сайт синхронізовані."
          primaryCta="Обрати напрям"
          primaryHref="#napryamy"
          secondaryCta="Подати оголошення"
          secondaryHref="/create"
        />
      </div>

      <div className="px-4 py-5 md:px-0 md:pb-8">
        <StatsBar />
      </div>

      <section id="napryamy" className="px-4 py-6 md:px-0 md:py-12">
        <div className="mb-5 text-center md:mb-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-4xl text-balance">
            Оберіть свій напрям
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Кожна аудиторія — окрема landing. Шукаєте роботу, працівників чи
            продаєте авто?
          </p>
        </div>
        <VerticalCards />
        <p className="mt-2 text-center text-[10px] text-slate-400 md:hidden">
          ← Прокрутіть →
        </p>
      </section>

      <section className="px-4 py-4 md:px-0 md:py-8">
        <CompareNote />
      </section>

      <div className="px-4 md:px-0">
        <FeatureGrid
          title="Чому UAREKLAMHUB?"
          items={[
            {
              title: "Миттєва публікація",
              description:
                "Після модерації — автоматично у Telegram, Viber, WhatsApp та на сайті.",
            },
            {
              title: "Мобільні боти",
              description:
                "Подайте оголошення за 7 кроків прямо в месенджері. Ukraynaca інтерфейс.",
            },
            {
              title: "Безпечна модерація",
              description: "Кожне оголошення перевіряється перед публікацією.",
            },
            {
              title: "По містах",
              description: "Київ, Львів, Одеса та інші — фільтр за локацією.",
            },
            {
              title: "VIP та підсилення",
              description: "Виділяйте оголошення серед конкурентів.",
            },
            {
              title: "Один акаунт",
              description: "Усі канали прив'язані до єдиного профілю.",
            },
          ]}
        />
      </div>

      <div className="px-4 pb-6 md:px-0 md:pb-24">
        <CTASection
          title="Готові почати?"
          subtitle="Зареєструйтесь безкоштовно або подайте перше оголошення за 5 хвилин."
          cta="Подати оголошення"
          href="/create"
        />
      </div>
    </div>
  );
}
