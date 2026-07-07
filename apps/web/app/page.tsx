import type { Metadata } from "next";
import { HomeRedirect } from "@/components/HomeRedirect";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CTASection } from "@/components/landing/CTASection";
import { FaqSection } from "@/components/landing/FaqSection";
import { TelegramChannelsShowcase } from "@/components/landing/TelegramChannelsShowcase";
import { PromoTopBanner } from "@/components/landing/PromoTopBanner";
import { AnnouncementsTicker } from "@/components/landing/AnnouncementsTicker";
import { CampaignsSection } from "@/components/landing/CampaignsSection";
import { AdPlacementsSection } from "@/components/landing/AdPlacementsSection";
import { PromotionPackages } from "@/components/landing/PromotionPackages";
import { AdvertiseSection } from "@/components/landing/AdvertiseSection";
import { FreeMonthPromo } from "@/components/landing/FreeMonthPromo";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  VerticalCards,
  StatsBar,
  CompareNote,
} from "@/components/landing/VerticalCards";
import { fetchTelegramChannels } from "@/lib/site-api";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { FAQ_ITEMS } from "@/lib/seo-content";
import {
  TOP_PROMO,
  FREE_MONTH_PROMO,
  ANNOUNCEMENTS,
  CAMPAIGNS,
  AD_PLACEMENTS,
  PROMOTION_PACKAGES,
  advertiseContactHref,
} from "@/lib/landing-promos";

export const metadata: Metadata = pageMetadata({
  title: "UAREKLAMHUB — Робота, Horeca та оголошення в Україні",
  description:
    "До 31 липня — усі оголошення безкоштовно! Вакансії, Horeca, авто через Telegram, Viber, WhatsApp або сайт.",
  path: "/",
  absoluteTitle: true,
});

export default async function HomePage() {
  const { channels, totalMembers, joinedThisWeek, botUsername } =
    await fetchTelegramChannels();
  const advertiseHref = advertiseContactHref(botUsername);

  return (
    <div className="md:mx-auto md:max-w-6xl md:px-6">
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <HomeRedirect />

      <div className="px-4 pt-4 md:px-0 md:pt-6">
        <TelegramChannelsShowcase
          channels={channels}
          totalMembers={totalMembers}
          joinedThisWeek={joinedThisWeek}
          botUsername={botUsername}
        />
      </div>

      <div className="px-4 pt-3 md:px-0 md:pt-4">
        <PromoTopBanner
          id={TOP_PROMO.id}
          text={TOP_PROMO.text}
          href={TOP_PROMO.href}
          cta={TOP_PROMO.cta}
        />
      </div>

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

      <div className="px-4 py-5 md:px-0 md:py-6">
        <FreeMonthPromo
          endsAt={FREE_MONTH_PROMO.endsAt}
          endsLabel={FREE_MONTH_PROMO.endsLabel}
          title={FREE_MONTH_PROMO.title}
          subtitle={FREE_MONTH_PROMO.subtitle}
          cta={FREE_MONTH_PROMO.cta}
          href={FREE_MONTH_PROMO.href}
        />
      </div>

      <div className="px-4 py-5 md:px-0 md:pb-8">
        <StatsBar />
      </div>

      <div className="px-4 pb-4 md:px-0">
        <AnnouncementsTicker items={ANNOUNCEMENTS} />
      </div>

      <CampaignsSection campaigns={CAMPAIGNS} />

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

      <AdPlacementsSection placements={AD_PLACEMENTS} contactHref={advertiseHref} />

      <PromotionPackages packages={PROMOTION_PACKAGES} />

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

      <FaqSection />

      <AdvertiseSection contactHref={advertiseHref} />

      <div className="px-4 pb-6 md:px-0 md:pb-24">
        <CTASection
          title="Не пропустіть акцію!"
          subtitle="До 31 липня публікація оголошень безкоштовна. Подайте за 5 хвилин."
          cta="Подати безкоштовно"
          href="/create"
        />
      </div>
    </div>
  );
}
