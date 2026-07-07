import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingSharedSections } from "@/components/landing/LandingSharedSections";
import { JobListingCard } from "@/components/listings/JobListingCard";
import { Button } from "@/components/ui/Button";
import { fetchProjectListings } from "@/lib/listings-api";
import { getLandingData } from "@/lib/landing-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Подати вакансію в Україні — Telegram, Viber, WhatsApp",
  description: "Опублікуйте вакансію — автоматичний розсил по всіх каналах. Знайдіть працівників швидко.",
  path: "/robota/employer",
});

export default async function RobotaEmployerPage() {
  const [listings, data] = await Promise.all([
    fetchProjectListings("jobs"),
    getLandingData(),
  ]);
  const recent = listings.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="py-4 sm:py-6">
        <LandingSharedSections
          data={data}
          hero={
            <Hero
              badge="🏢 Для роботодавців"
              title="Знайдіть працівників"
              highlight="швидко та ефективно"
              subtitle="Одна вакансія — публікація в Telegram, Viber, WhatsApp, Instagram та на сайті. Модерація за 24 години."
              primaryCta="Подати вакансію"
              primaryHref="/create?project=jobs"
              secondaryCta="Увійти"
              secondaryHref="/login"
              gradient="from-violet-600 via-purple-600 to-indigo-800"
            />
          }
          cta={{
            title: "Перша вакансія безкоштовно",
            subtitle: "До 31 липня — публікація без оплати. Подайте за 5 хвилин.",
            cta: "Подати вакансію",
            href: "/create?project=jobs",
          }}
          beforeBottom={
            <>
              <FeatureGrid
                title="Переваги для бізнесу"
                items={[
                  {
                    title: "Мультиканальність",
                    description: "Одне оголошення — Telegram, Viber, WhatsApp, Instagram, сайт.",
                  },
                  {
                    title: "Цільова аудиторія",
                    description: "Фільтр за містом та категорією вакансії.",
                  },
                  {
                    title: "Аналітика",
                    description: "Перегляди та відгуки в особистому кабінеті.",
                  },
                ]}
              />
              <div className="mb-8 rounded-2xl border border-violet-100 bg-violet-50 p-6">
                <p className="text-violet-900">
                  <strong>Ресторан або готель?</strong> Для HoReCa є{" "}
                  <Link href="/horeca" className="font-semibold underline">
                    окремий напрям
                  </Link>{" "}
                  зі спеціалізованими категоріями.
                </p>
              </div>
            </>
          }
        >
          {recent.length > 0 && (
            <section className="mb-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Останні вакансії</h2>
                <Link
                  href="/jobs/kyiv/ogoloshennya"
                  className="text-sm font-semibold text-violet-700 hover:underline"
                >
                  Усі →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((listing) => (
                  <JobListingCard key={listing.id} listing={listing} project="jobs" />
                ))}
              </div>
            </section>
          )}

          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", title: "Реєстрація", desc: "Створіть акаунт роботодавця" },
              { step: "2", title: "Заповніть форму", desc: "7 кроків — вакансія готова" },
              { step: "3", title: "Модерація", desc: "Автопублікація на всі канали" },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                  {s.step}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </LandingSharedSections>
      </div>

      <div className="flex justify-center gap-4 pb-16 flex-wrap">
        <Button href="/robota" variant="outline">
          ← Шукаю роботу
        </Button>
        <Button href="/login">Увійти</Button>
      </div>
    </div>
  );
}
