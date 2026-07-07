import type { Metadata } from "next";
import { HomeRedirect } from "@/components/HomeRedirect";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingSharedSections } from "@/components/landing/LandingSharedSections";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLandingData } from "@/lib/landing-data";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { FAQ_ITEMS } from "@/lib/seo-content";

export const metadata: Metadata = pageMetadata({
  title: "UAREKLAMHUB — Робота, Horeca та оголошення в Україні",
  description:
    "До 31 липня — усі оголошення безкоштовно! Вакансії, Horeca, авто через Telegram, Viber, WhatsApp або сайт.",
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const data = await getLandingData();

  return (
    <div className="md:mx-auto md:max-w-6xl md:px-6">
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <HomeRedirect />

      <div className="px-4 pt-4 md:px-0 md:pt-6">
        <LandingSharedSections
          data={data}
          variant="home"
          hero={
            <Hero
              badge="🇺🇦 Платформа для України"
              title="Оголошення, які"
              highlight="працюють на вас"
              subtitle="Робота, Horeca, авто — одне місце. Публікація в Telegram, Viber, WhatsApp, Instagram та на сайті."
              primaryCta="Обрати напрям"
              primaryHref="#napryamy"
              secondaryCta="Подати оголошення"
              secondaryHref="/create"
            />
          }
          midContent={
            <FeatureGrid
              title="Чому UAREKLAMHUB?"
              items={[
                {
                  title: "Миттєва публікація",
                  description:
                    "Після модерації — Telegram, Viber, WhatsApp, Instagram та сайт одночасно.",
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
          }
        />
      </div>
    </div>
  );
}
