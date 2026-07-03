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
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <HomeRedirect />
      <div className="py-8 sm:py-12 animate-fade-in">
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

      <div className="pb-8">
        <StatsBar />
      </div>

      <section id="napryamy" className="py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
            Оберіть свій напрям
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Кожна аудиторія — окрема landing. Шукаєте роботу, працівників чи
            продаєте авто?
          </p>
        </div>
        <VerticalCards />
      </section>

      <section className="py-8">
        <CompareNote />
      </section>

      <FeatureGrid
        title="Чому İlanHub?"
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

      <div className="pb-16 sm:pb-24">
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
