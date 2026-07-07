import Link from "next/link";
import type { PromoCampaign } from "@/lib/landing-promos";

function CampaignCard({ campaign }: { campaign: PromoCampaign }) {
  return (
    <Link
      href={campaign.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 sm:p-6"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${campaign.gradient} opacity-[0.04] transition group-hover:opacity-[0.08]`}
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl">{campaign.icon}</span>
          {campaign.badge && (
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
              {campaign.badge}
            </span>
          )}
        </div>
        {campaign.sponsor && (
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {campaign.sponsor}
          </p>
        )}
        {campaign.endsAt && (
          <p className="mt-1 text-[10px] font-semibold text-emerald-600">
            До {campaign.endsAt}
          </p>
        )}
        <h3 className="mt-2 text-lg font-bold text-slate-900">{campaign.title}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">
          {campaign.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-all group-hover:gap-2">
          {campaign.cta} →
        </span>
      </div>
    </Link>
  );
}

export function CampaignsSection({ campaigns }: { campaigns: PromoCampaign[] }) {
  return (
    <section id="kampaniyi" className="px-4 py-6 md:px-0 md:py-10">
      <div className="mb-5 text-center md:mb-8">
        <span className="mb-2 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
          Монетизація
        </span>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
          Кампанії та пропозиції
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Підсиліть оголошення, замовте рекламу в каналах або займіть банер на головній.
        </p>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x-mandatory md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4">
        {campaigns.map((c) => (
          <div key={c.id} className="w-[78vw] max-w-[280px] shrink-0 snap-start md:w-auto md:max-w-none">
            <CampaignCard campaign={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
