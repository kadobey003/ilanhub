import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CTASection } from "@/components/landing/CTASection";
import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { Button } from "@/components/ui/Button";
import { fetchProjectListings } from "@/lib/listings-api";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Horeca — Ресторани та готелі",
  description: "Вакансії та оголошення для ресторанів, кафе, барів та готелів",
};

const roles = [
  "Кухар",
  "Бармен",
  "Офіціант",
  "Адміністратор",
  "Повар",
  "Хостес",
  "Менеджер залу",
];

export default async function HorecaPage() {
  const listings = await fetchProjectListings("horeca");
  const recent = listings.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="py-8 sm:py-12">
        <Hero
          badge="🍽️ HoReCa vertical"
          title="Ресторани."
          highlight="Кафе. Готелі."
          subtitle="Окремий напрям від загальної роботи. Спеціалізовані категорії, канали та аудиторія для індустрії гостинності."
          primaryCta="Вакансії Horeca"
          primaryHref="/horeca/kyiv/ogoloshennya"
          secondaryCta="Подати вакансію"
          secondaryHref="/create?project=horeca"
          gradient="from-amber-500 via-orange-500 to-red-600"
        />
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-slate-900">Популярні позиції</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {roles.map((role) => (
            <span
              key={role}
              className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900"
            >
              {role}
            </span>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Актуальні вакансії</h2>
              <p className="mt-1 text-sm text-slate-600">Як у Telegram-каналі — з фото та деталями</p>
            </div>
            <Link
              href="/horeca/kyiv/ogoloshennya"
              className="text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Усі →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((listing) => (
              <HorecaListingCard key={listing.id} listing={listing} project="horeca" />
            ))}
          </div>
        </section>
      )}

      <div className="mb-12 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-amber-950">
          Чим Horeca відрізняється від «Роботи»?
        </h3>
        <ul className="mt-4 space-y-3 text-amber-900/90 text-sm sm:text-base">
          <li className="flex gap-2">
            <span>✓</span>
            <span>
              <strong>Робота</strong> — усі сектори: IT, офіс, склад, завод
            </span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>
              <strong>Horeca</strong> — лише гостинність: їжа, напої, готелі
            </span>
          </li>
          <li className="flex gap-2">
            <span>✓</span>
            <span>Окремі Telegram-канали та категорії для кожного vertical</span>
          </li>
        </ul>
      </div>

      <FeatureGrid
        title="Для кого Horeca?"
        items={[
          {
            title: "Ресторани та кафе",
            description: "Швидкий набір персоналу на сезон або постійно.",
          },
          {
            title: "Готелі та хостели",
            description: "Адміністратори, покоївки, ресепшн.",
          },
          {
            title: "Кандидати",
            description: "Знайдіть роботу саме в індустрії гостинності.",
          },
        ]}
      />

      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href="/create?project=horeca" size="lg">
          Подати вакансію Horeca
        </Button>
        <Button href="/robota" variant="outline" size="lg">
          Загальна робота
        </Button>
      </div>

      <CTASection
        title="Працюєте в HoReCa?"
        subtitle="Приєднуйтесь до спеціалізованої платформи для вашої індустрії."
        cta="Зареєструватись"
        href="/register?from=horeca"
      />

      <div className="pb-16" />
    </div>
  );
}
