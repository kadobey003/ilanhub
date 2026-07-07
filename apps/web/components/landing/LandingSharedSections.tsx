import type { ReactNode } from "react";
import { TelegramChannelsShowcase } from "@/components/landing/TelegramChannelsShowcase";
import { PromoTopBanner } from "@/components/landing/PromoTopBanner";
import { AnnouncementsTicker } from "@/components/landing/AnnouncementsTicker";
import { CampaignsSection } from "@/components/landing/CampaignsSection";
import { AdPlacementsSection } from "@/components/landing/AdPlacementsSection";
import { AdvertiseSection } from "@/components/landing/AdvertiseSection";
import { FreeMonthPromo } from "@/components/landing/FreeMonthPromo";
import { PublishChannelsSection } from "@/components/landing/PublishChannelsSection";
import { SocialPresenceHub } from "@/components/landing/SocialPresenceHub";
import { CTASection } from "@/components/landing/CTASection";
import { FaqSection } from "@/components/landing/FaqSection";
import { StatsBar, CompareNote, VerticalCards } from "@/components/landing/VerticalCards";
import type { LandingData } from "@/lib/landing-data";
import {
  TOP_PROMO,
  FREE_MONTH_PROMO,
  ANNOUNCEMENTS,
  CAMPAIGNS,
  AD_PLACEMENTS,
} from "@/lib/landing-promos";

type CtaProps = {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

export function LandingSharedSections({
  data,
  variant = "vertical",
  hero,
  children,
  midContent,
  beforeBottom,
  cta,
}: {
  data: LandingData;
  variant?: "home" | "vertical";
  hero: ReactNode;
  children?: ReactNode;
  midContent?: ReactNode;
  beforeBottom?: ReactNode;
  cta?: CtaProps;
}) {
  const {
    channels,
    totalMembers,
    joinedThisWeek,
    botUsername,
    social,
    presence,
    advertiseHref,
  } = data;

  const finalCta = cta ?? {
    title: "Не пропустіть акцію!",
    subtitle: "До 31 липня публікація оголошень безкоштовна. Подайте за 5 хвилин.",
    cta: "Подати безкоштовно",
    href: "/create",
  };

  return (
    <>
      {channels.length > 0 && (
        <div className="mb-4 md:mb-6">
          <TelegramChannelsShowcase
            channels={channels}
            totalMembers={totalMembers}
            joinedThisWeek={joinedThisWeek}
            botUsername={botUsername}
          />
        </div>
      )}

      <div className="mb-4 md:mb-5">
        <PromoTopBanner
          id={TOP_PROMO.id}
          text={TOP_PROMO.text}
          href={TOP_PROMO.href}
          cta={TOP_PROMO.cta}
        />
      </div>

      <div className="animate-fade-in">{hero}</div>

      <div className="py-5 md:py-6">
        <FreeMonthPromo
          endsAt={FREE_MONTH_PROMO.endsAt}
          endsLabel={FREE_MONTH_PROMO.endsLabel}
          title={FREE_MONTH_PROMO.title}
          subtitle={FREE_MONTH_PROMO.subtitle}
          cta={FREE_MONTH_PROMO.cta}
          href={FREE_MONTH_PROMO.href}
        />
      </div>

      <PublishChannelsSection />

      {variant === "home" && (
        <div className="py-5 md:pb-8">
          <StatsBar />
        </div>
      )}

      {children}

      <div className="pb-4">
        <AnnouncementsTicker items={ANNOUNCEMENTS} />
      </div>

      <CampaignsSection campaigns={CAMPAIGNS} />

      <SocialPresenceHub
        presence={presence}
        bots={social.bots}
        botUsername={botUsername}
      />

      {variant === "home" && (
        <section id="napryamy" className="py-6 md:py-12">
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
      )}

      {variant === "home" && (
        <section className="py-4 md:py-8">
          <CompareNote />
        </section>
      )}

      {midContent}

      {beforeBottom}

      <AdPlacementsSection placements={AD_PLACEMENTS} contactHref={advertiseHref} />

      {variant === "home" && <FaqSection />}

      <AdvertiseSection contactHref={advertiseHref} />

      <div className="pb-6 md:pb-16">
        <CTASection {...finalCta} />
      </div>
    </>
  );
}
