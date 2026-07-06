import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchProjectListings } from "@/lib/listings-api";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { getHorecaRole, HORECA_ROLES } from "@/lib/seo-content";

export function generateStaticParams() {
  return HORECA_ROLES.map((role) => ({ role: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role: slug } = await params;
  const role = getHorecaRole(slug);
  if (!role) return { title: "Horeca вакансії" };
  return pageMetadata({
    title: `Вакансії ${role.name} — Horeca Україна`,
    description: role.description,
    path: `/horeca/vakansiyi/${role.slug}`,
  });
}

function matchesRole(
  listing: { title?: string | null; positionTitles?: string[]; firstVacancyTitle?: string | null },
  keywords: string[],
): boolean {
  const haystack = [
    listing.title,
    listing.firstVacancyTitle,
    ...(listing.positionTitles ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

export default async function HorecaRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role: slug } = await params;
  const role = getHorecaRole(slug);
  if (!role) notFound();

  const all = await fetchProjectListings("horeca", undefined, "vacancy");
  const listings = all.filter((l) => matchesRole(l, role.keywords));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd
        data={itemListJsonLd({
          name: `Вакансії ${role.name}`,
          path: `/horeca/vakansiyi/${role.slug}`,
          items: listings.slice(0, 20).map((l) => ({
            name: l.title ?? role.name,
            path: `/horeca/listing/${l.id}`,
          })),
        })}
      />

      <Link href="/horeca" className="text-sm text-amber-700 hover:text-amber-800">
        ← Horeca
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        Вакансії: {role.name}
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">{role.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {HORECA_ROLES.map((r) => (
          <Link
            key={r.slug}
            href={`/horeca/vakansiyi/${r.slug}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              r.slug === role.slug ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            {r.name}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-10 text-center">
          <p className="text-slate-600">Поки немає вакансій для позиції «{role.name}».</p>
          <Button href="/create?project=horeca" className="mt-4">
            Подати вакансію
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <HorecaListingCard key={listing.id} listing={listing} project="horeca" />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Button href="/horeca/ogoloshennya" variant="outline">
          Усі Horeca вакансії →
        </Button>
      </div>
    </div>
  );
}
