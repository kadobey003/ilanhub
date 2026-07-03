import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { CTASection } from "@/components/landing/CTASection";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Шукаю роботу",
  description: "Вакансії по всій Україні — офіс, IT, виробництво, логістика",
};

const cities = ["Київ", "Львів", "Одеса", "Харків", "Дніпро", "Запоріжжя"];

export default function RobotaSeekerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="py-8 sm:py-12">
        <Hero
          badge="💼 Для кандидатів"
          title="Знайдіть роботу"
          highlight="у своєму місті"
          subtitle="Тисячі вакансій від перевірених роботодавців. Офіс, IT, склад, будівництво — не плутайте з Horeca."
          primaryCta="Переглянути вакансії"
          primaryHref="/jobs"
          secondaryCta="Horeca вакансії"
          secondaryHref="/horeca"
          gradient="from-blue-600 via-brand to-indigo-800"
        />
      </div>

      <section className="pb-12">
        <h2 className="text-xl font-bold text-slate-900">Популярні міста</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map((city) => (
            <Link
              key={city}
              href={`/jobs/${city.toLowerCase()}/ogoloshennya`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>

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

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 mb-12">
        <p className="text-blue-900">
          <strong>Шукаєте роботу в ресторані?</strong> Перейдіть на{" "}
          <Link href="/horeca" className="font-semibold underline">
            Horeca
          </Link>{" "}
          — окремий напрям для кафе, барів та готелів.
        </p>
      </div>

      <CTASection
        title="Ще немає акаунту?"
        subtitle="Зареєструйтесь, щоб зберігати відгуки та отримувати сповіщення."
        cta="Зареєструватись"
        href="/register?from=robota"
      />

      <div className="pb-16 flex justify-center">
        <Button href="/robota/employer" variant="outline">
          Я роботодавець →
        </Button>
      </div>
    </div>
  );
}
