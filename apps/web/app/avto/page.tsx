import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingSharedSections } from "@/components/landing/LandingSharedSections";
import { getLandingData } from "@/lib/landing-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Продаж авто в Україні",
  description: "Купівля та продаж автомобілів по всій Україні",
  path: "/avto",
});

const brands = ["Toyota", "Volkswagen", "BMW", "Hyundai", "Renault", "Skoda"];

export default async function AvtoPage() {
  const data = await getLandingData();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="py-4 sm:py-6">
        <LandingSharedSections
          data={data}
          hero={
            <Hero
              badge="🚗 Автомобілі"
              title="Продайте авто"
              highlight="за кілька днів"
              subtitle="Легкові, вантажні, мото. Публікація в Telegram, Viber, WhatsApp, Instagram та на сайті після модерації."
              primaryCta="Подати оголошення"
              primaryHref="/create?project=auto"
              secondaryCta="Переглянути авто"
              secondaryHref="/auto"
              gradient="from-emerald-600 via-teal-600 to-cyan-700"
            />
          }
          cta={{
            title: "Готові продати?",
            subtitle: "До 31 липня публікація безкоштовна. Перше оголошення — за 5 хвилин.",
            cta: "Подати оголошення",
            href: "/create?project=auto",
          }}
          beforeBottom={
            <FeatureGrid
              title="Чому продавати на UAREKLAMHUB?"
              items={[
                {
                  title: "Широка аудиторія",
                  description: "Telegram-канали по містах + Instagram + сайт + месенджери.",
                },
                {
                  title: "До 20 фото",
                  description: "Галерея з водяним знаком — професійний вигляд оголошення.",
                },
                {
                  title: "Мультиканальність",
                  description: "Одне оголошення — усі платформи одночасно.",
                },
              ]}
            />
          }
        >
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
        </LandingSharedSections>
      </div>
    </div>
  );
}
