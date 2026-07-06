import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CTASection } from "@/components/landing/CTASection";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Продаж авто в Україні",
  description: "Купівля та продаж автомобілів по всій Україні",
  path: "/avto",
});

const brands = ["Toyota", "Volkswagen", "BMW", "Hyundai", "Renault", "Skoda"];

export default function AvtoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="py-8 sm:py-12">
        <Hero
          badge="🚗 Автомобілі"
          title="Продайте авто"
          highlight="за кілька днів"
          subtitle="Легкові, вантажні, мото. Фото, ціна, місто — і ваше оголошення на всіх каналах після модерації."
          primaryCta="Подати оголошення"
          primaryHref="/create?project=auto"
          secondaryCta="Переглянути авто"
          secondaryHref="/auto"
          gradient="from-emerald-600 via-teal-600 to-cyan-700"
        />
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900">Популярні марки</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {brands.map((b) => (
            <span
              key={b}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800"
            >
              {b}
            </span>
          ))}
        </div>
      </section>

      <FeatureGrid
        title="Чому продавати на İlanHub?"
        items={[
          {
            title: "Широка аудиторія",
            description: "Telegram-канали по містах + сайт + месенджери.",
          },
          {
            title: "До 20 фото",
            description: "Галерея з водяним знаком — професійний вигляд оголошення.",
          },
          {
            title: "VIP-виділення",
            description: "Підніміть оголошення в топ результатів пошуку.",
          },
        ]}
      />

      <CTASection
        title="Готові продати?"
        subtitle="Реєстрація займає 1 хвилину. Перше оголошення — за 5 хвилин."
        cta="Подати оголошення"
        href="/create?project=auto"
      />

      <div className="pb-16" />
    </div>
  );
}
