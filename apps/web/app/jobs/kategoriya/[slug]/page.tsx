import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JobListingCard } from "@/components/listings/JobListingCard";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchProjectListings } from "@/lib/listings-api";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { getJobCategory, JOB_CATEGORIES } from "@/lib/seo-content";

export function generateStaticParams() {
  return JOB_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getJobCategory(slug);
  if (!cat) return { title: "Вакансії" };
  return pageMetadata({
    title: `Вакансії ${cat.name} — робота в Україні`,
    description: `Актуальні вакансії у сфері «${cat.name}» по всій Україні. Telegram, Viber та сайт.`,
    path: `/jobs/kategoriya/${cat.slug}`,
  });
}

function matchesCategory(
  listing: {
    title?: string | null;
    categoryName?: string | null;
    positionTitles?: string[];
    firstVacancyTitle?: string | null;
  },
  keywords: string[],
): boolean {
  const haystack = [
    listing.title,
    listing.categoryName,
    listing.firstVacancyTitle,
    ...(listing.positionTitles ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

export default async function JobsCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getJobCategory(slug);
  if (!cat) notFound();

  const all = await fetchProjectListings("jobs");
  const listings = all.filter((l) => matchesCategory(l, cat.keywords));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd
        data={itemListJsonLd({
          name: `Вакансії ${cat.name}`,
          path: `/jobs/kategoriya/${cat.slug}`,
          items: listings.slice(0, 20).map((l) => ({
            name: l.title ?? cat.name,
            path: `/jobs/listing/${l.id}`,
          })),
        })}
      />

      <Link href="/jobs" className="text-sm text-brand hover:underline">
        ← Усі вакансії
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Вакансії: {cat.name}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {JOB_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/jobs/kategoriya/${c.slug}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              c.slug === cat.slug ? "bg-brand text-white" : "bg-blue-100 text-blue-900"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-10 text-center">
          <p className="text-slate-600">Поки немає вакансій у категорії «{cat.name}».</p>
          <Button href="/create?project=jobs" className="mt-4">
            Подати вакансію
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <JobListingCard key={listing.id} listing={listing} project="jobs" />
          ))}
        </div>
      )}
    </div>
  );
}
