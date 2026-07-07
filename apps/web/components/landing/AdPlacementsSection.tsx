import Link from "next/link";
import type { AdPlacement } from "@/lib/landing-promos";

function PlacementCard({ placement }: { placement: AdPlacement }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 transition hover:border-brand/30 hover:bg-white sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-slate-100">
          {placement.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900">{placement.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{placement.location}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-lg bg-white px-2 py-1 font-medium text-slate-600 ring-1 ring-slate-100">
          {placement.size}
        </span>
        <span className="rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
          від {placement.priceFrom}
        </span>
        <span className="rounded-lg bg-blue-50 px-2 py-1 font-medium text-blue-700">
          {placement.impressions}
        </span>
      </div>
    </div>
  );
}

function DemoBannerSlot({ contactHref }: { contactHref: string }) {
  return (
    <Link
      href={contactHref}
      className="group relative flex min-h-[120px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-100 to-slate-50 transition hover:border-brand hover:from-blue-50 hover:to-indigo-50 sm:min-h-[160px]"
    >
      <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,#64748b_0,#64748b_1px,transparent_0,transparent_50%)] bg-[length:12px_12px]" />
      <div className="relative text-center px-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-brand">
          Рекламний банер
        </p>
        <p className="mt-1 text-sm text-slate-500 group-hover:text-slate-700">
          970 × 250 · Ваш бренд тут
        </p>
        <span className="mt-3 inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-brand shadow-sm ring-1 ring-slate-200 transition group-hover:ring-brand/30">
          Забронювати місце →
        </span>
      </div>
    </Link>
  );
}

export function AdPlacementsSection({
  placements,
  contactHref,
}: {
  placements: AdPlacement[];
  contactHref: string;
}) {
  return (
    <section id="reklama" className="px-4 py-6 md:px-0 md:py-10">
      <div className="mb-5 md:mb-6">
        <span className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Рекламні місця
        </span>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Де розмістити рекламу
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Банери, нативні картки та пости в Telegram-каналах. Прозорі ціни та
          звітність по охопленню.
        </p>
      </div>

      <DemoBannerSlot contactHref={contactHref} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {placements.map((p) => (
          <PlacementCard key={p.id} placement={p} />
        ))}
      </div>

      <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-semibold text-slate-900">Потрібен індивідуальний пакет?</p>
          <p className="mt-1 text-sm text-slate-500">
            Комбінуйте банери, VIP та Telegram — знижка до 20% на пакети.
          </p>
        </div>
        <Link
          href={contactHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
        >
          Зв&apos;язатися з відділом реклами
        </Link>
      </div>
    </section>
  );
}
