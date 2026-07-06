import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { Button } from "@/components/ui/Button";
import { cityProdazhPath } from "@/lib/cities";
import { fetchProjectCities } from "@/lib/cities-api";
import { fetchProjectListings, fetchProjectBrowseMeta } from "@/lib/listings-api";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = pageMetadata({
  title: "Horeca — б/в обладнання",
  description: "Продаж б/в обладнання для ресторанів, кафе та готелів",
  path: "/horeca/prodazh",
});

export default async function HorecaProdazhPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: citySlug } = await searchParams;

  if (citySlug) {
    redirect(cityProdazhPath(citySlug));
  }
  const cities = await fetchProjectCities("horeca");
  const listings = await fetchProjectListings("horeca", undefined, "product");
  const browse = await fetchProjectBrowseMeta("horeca");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/horeca" className="text-sm text-amber-700 hover:text-amber-800">← Horeca</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">🏪 Б/в обладнання</h1>
          <p className="mt-1 text-slate-600">
            По всій Україні — плити, холодильники, посуд та інше
          </p>
        </div>
        <Button href="/create?project=horeca&mode=sell">Продати обладнання</Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/horeca/prodazh"
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white"
        >
          Усі міста
        </Link>
        {cities.map((c) => (
          <Link
            key={c.slug}
            href={cityProdazhPath(c.slug)}
            className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-10 text-center">
          <p className="text-slate-600">Поки немає оголошень.</p>
          <Button href="/create?project=horeca&mode=sell" className="mt-4">Подати перше оголошення</Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <HorecaListingCard key={listing.id} listing={listing} project="horeca" variant="product" />
          ))}
        </div>
      )}

      {browse.telegramChannels.length > 0 && (
        <section className="mt-12 rounded-2xl border border-amber-100 bg-amber-50/40 p-6">
          <h2 className="font-bold text-amber-950">Telegram-канали</h2>
          <p className="mt-1 text-sm text-amber-900/80">Нові оголошення також у наших каналах</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {browse.telegramChannels.map((ch) => (
              <a key={ch.channelId} href={ch.url} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-100">
                {ch.name}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
