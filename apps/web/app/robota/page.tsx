import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingSharedSections } from "@/components/landing/LandingSharedSections";
import { Button } from "@/components/ui/Button";
import { CityChips } from "@/components/listings/CityChips";
import { JobListingCard } from "@/components/listings/JobListingCard";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings } from "@/lib/listings-api";
import { getLandingData } from "@/lib/landing-data";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Шукаю роботу в Україні — вакансії по містах",
  description: "Вакансії по всій Україні — офіс, IT, виробництво, логістика. Telegram, Viber та сайт.",
  path: "/robota",
});

export default async function RobotaSeekerPage() {
  const [cities, listings, data] = await Promise.all([
    fetchProjectCities("jobs"),
    fetchProjectListings("jobs"),
    getLandingData(),
  ]);
  const recent = listings.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-nav sm:px-6 md:pb-16">
      <div className="py-4 sm:py-6">
        <LandingSharedSections
          data={data}
          hero={
            <Hero
              badge="💼 Для кандидатів"
              title="Знайдіть роботу"
              highlight="у своєму місті"
              subtitle="Тисячі вакансій від перевірених роботодавців. Офіс, IT, склад, будівництво — не плутайте з Horeca."
              primaryCta="Переглянути вакансії"
              primaryHref="/jobs/kyiv/ogoloshennya"
              secondaryCta="Horeca вакансії"
              secondaryHref="/horeca"
              gradient="from-blue-600 via-brand to-indigo-800"
            />
          }
          cta={{
            title: "Ще немає акаунту?",
            subtitle: "Зареєструйтесь, щоб зберігати відгуки та отримувати сповіщення.",
            cta: "Зареєструватись",
            href: "/register?from=robota",
          }}
          beforeBottom={
            <>
              <FeatureGrid
                title="Як це працює?"
                items={[
                  {
                    title: "Оберіть місто",
                    description: "Фільтруйте вакансії за локацією та категорією.",
                  },
                  {
                    title: "Зв'яжіться",
                    description: "Телефон або месенджер — напряму з роботодавцем.",
                  },
                  {
                    title: "Отримуйте сповіщення",
                    description: "Нові вакансії у Telegram та Viber боті.",
                  },
                ]}
              />
              <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <p className="text-blue-900">
                  <strong>Шукаєте роботу в ресторані?</strong> Перейдіть на{" "}
                  <Link href="/horeca" className="font-semibold underline">
                    Horeca
                  </Link>{" "}
                  — окремий напрям для кафе, барів та готелів.
                </p>
              </div>
            </>
          }
        >
          <section className="pb-12">
            <h2 className="text-xl font-bold text-slate-900">Популярні міста</h2>
            <div className="mt-4">
              <CityChips project="jobs" cities={cities} allHref="/jobs" />
            </div>
          </section>

          {recent.length > 0 && (
            <section className="pb-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Актуальні вакансії</h2>
                <Link
                  href="/jobs/kyiv/ogoloshennya"
                  className="text-sm font-semibold text-brand hover:underline"
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
        </LandingSharedSections>
      </div>

      <div className="flex justify-center pb-8">
        <Button href="/robota/employer" variant="outline">
          Я роботодавець →
        </Button>
      </div>
    </div>
  );
}
