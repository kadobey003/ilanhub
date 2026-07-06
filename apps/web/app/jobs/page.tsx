import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CTASection } from "@/components/landing/CTASection";
import { JobListingCard } from "@/components/listings/JobListingCard";
import { CityChips } from "@/components/listings/CityChips";
import { TelegramBrowseBanner } from "@/components/listings/TelegramBrowseBanner";
import { Button } from "@/components/ui/Button";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings, fetchProjectBrowseMeta } from "@/lib/listings-api";
import { pageMetadata } from "@/lib/seo";
import { JOB_CATEGORIES } from "@/lib/seo-content";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "Робота — вакансії по всій Україні",
  description: "Вакансії по всій Україні — офіс, IT, виробництво, логістика",
  path: "/jobs",
});

export default async function JobsPage() {
  const [listings, cities, browse] = await Promise.all([
    fetchProjectListings("jobs"),
    fetchProjectCities("jobs"),
    fetchProjectBrowseMeta("jobs"),
  ]);
  const recent = listings.slice(0, 6);

  return (
    <div className="pb-nav md:pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-6 sm:py-10">
          <Hero
            badge="💼 Вакансії"
            title="Робота"
            highlight="по всій Україні"
            subtitle="Офіс, IT, склад, будівництво, логістика. Окремо від Horeca — оберіть місто та знайдіть вакансію."
            primaryCta="Київ — вакансії"
            primaryHref="/jobs/kyiv/ogoloshennya"
            secondaryCta="Подати вакансію"
            secondaryHref="/create?project=jobs"
            gradient="from-blue-600 via-brand to-indigo-800"
          />
        </div>

        <section className="pb-6">
          <TelegramBrowseBanner
            channels={browse.telegramChannels}
            botUsername={browse.botUsername}
          />
        </section>

        <section className="pb-8">
          <h2 className="text-lg font-bold text-slate-900">Категорії</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {JOB_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/jobs/kategoriya/${cat.slug}`}
                className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-8">
          <h2 className="text-lg font-bold text-slate-900">Оберіть місто</h2>
          <p className="mt-1 text-sm text-slate-500">Гортайте на мобільному →</p>
          <div className="mt-4">
            <CityChips project="jobs" cities={cities} allHref="/jobs" />
          </div>
        </section>

        {recent.length > 0 && (
          <section className="pb-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Актуальні вакансії</h2>
                <p className="mt-1 text-sm text-slate-600">Оновлюється автоматично</p>
              </div>
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

        <FeatureGrid
          title="Як знайти роботу?"
          items={[
            {
              title: "Оберіть місто",
              description: "Фільтр за локацією — Київ, Львів, Одеса та інші.",
            },
            {
              title: "Звʼяжіться",
              description: "Телефон або месенджер напряму з роботодавцем.",
            },
            {
              title: "Сповіщення",
              description: "Нові вакансії у Telegram-боті 24/7.",
            },
          ]}
        />

        <div className="my-10 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <p className="text-blue-900 text-sm sm:text-base">
            <strong>Ресторан, кафе чи готель?</strong>{" "}
            <Link href="/horeca" className="font-semibold underline">
              Horeca
            </Link>{" "}
            — окремий напрям зі своїми каналами.
          </p>
        </div>

        <CTASection
          title="Шукаєте працівників?"
          subtitle="Опублікуйте вакансію — Telegram, Viber, WhatsApp та сайт."
          cta="Для роботодавців"
          href="/robota/employer"
        />

        <div className="flex justify-center pb-8">
          <Button href="/register?from=jobs" variant="outline">
            Зареєструватись
          </Button>
        </div>
      </div>
    </div>
  );
}
