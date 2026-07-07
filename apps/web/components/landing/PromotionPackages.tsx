import Link from "next/link";
import type { PromotionPackage } from "@/lib/landing-promos";

function PackageCard({ pkg }: { pkg: PromotionPackage }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-5 sm:p-6 ${
        pkg.highlighted
          ? "border-brand bg-gradient-to-b from-blue-50 to-white shadow-lg shadow-brand/10 ring-2 ring-brand/20"
          : "border-slate-100 bg-white shadow-sm"
      }`}
    >
      {pkg.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Рекомендуємо
        </span>
      )}
      <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{pkg.description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-slate-900">{pkg.price}</span>
        <span className="text-sm text-slate-500">₴ / {pkg.period}</span>
      </div>
      <ul className="mt-5 flex-1 space-y-2.5">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-0.5 text-emerald-500">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={pkg.href}
        className={`mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition ${
          pkg.highlighted
            ? "bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark"
            : "bg-slate-100 text-slate-800 hover:bg-slate-200"
        }`}
      >
        {pkg.cta}
      </Link>
    </div>
  );
}

export function PromotionPackages({ packages }: { packages: PromotionPackage[] }) {
  return (
    <section id="pakety" className="px-4 py-6 md:px-0 md:py-10">
      <div className="mb-5 text-center md:mb-8">
        <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          Тарифи
        </span>
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl text-balance">
          Пакети підсилення оголошень
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Виділіть оголошення серед конкурентів. Оплата через Telegram або на
          сайті після модерації.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
    </section>
  );
}
