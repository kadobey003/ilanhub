"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BrowseCategory,
  BrowseTelegramChannel,
  PublicListingSummary,
} from "@/lib/listings-types";
import { SavedListingsBar } from "@/components/listing/SavedListingsBar";
import { CityGrid } from "./CityGrid";
import { FeaturedListingsSection } from "./FeaturedListingsSection";
import { JobListingCard } from "./JobListingCard";
import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { ListingsEmptyState } from "./ListingsEmptyState";
import { TelegramBrowseBanner } from "./TelegramBrowseBanner";
import { isHorecaProject } from "@/lib/listings-api";
import { cityListingsPath } from "@/lib/cities";
import type { CityOption } from "@/lib/cities";

type SortKey = "newest" | "oldest" | "vacancies";

const JOB_QUICK = [
  { label: "IT", query: "it" },
  { label: "Офіс", query: "офіс" },
  { label: "Склад", query: "склад" },
  { label: "Водій", query: "водій" },
  { label: "Курʼєр", query: "кур" },
  { label: "Бухгалтер", query: "бухгалтер" },
];

interface Props {
  project: string;
  listings: PublicListingSummary[];
  cities: CityOption[];
  categories: BrowseCategory[];
  telegramChannels: BrowseTelegramChannel[];
  botUsername: string | null;
  citySlug?: string;
  cityName?: string;
  allHref: string;
  horeca?: boolean;
}

function listingHaystack(l: PublicListingSummary): string {
  return [
    l.title,
    l.firstVacancyTitle,
    l.businessType,
    l.address,
    l.categoryName,
    ...(l.positionTitles ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function ListingsBrowser({
  project,
  listings,
  cities,
  categories,
  telegramChannels,
  botUsername,
  citySlug,
  cityName,
  allHref,
  horeca: horecaProp,
}: Props) {
  const router = useRouter();
  const horeca = horecaProp ?? isHorecaProject(project);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const businessTypes = useMemo(() => {
    const set = new Set<string>();
    for (const l of listings) {
      if (l.businessType?.trim()) set.add(l.businessType.trim());
    }
    return [...set].sort();
  }, [listings]);

  const filtered = useMemo(() => {
    let rows = [...listings];
    const q = query.trim().toLowerCase();

    if (q) rows = rows.filter((l) => listingHaystack(l).includes(q));
    if (category) rows = rows.filter((l) => l.categorySlug === category);
    if (businessType) rows = rows.filter((l) => l.businessType === businessType);

    rows.sort((a, b) => {
      if (sort === "vacancies") return b.vacancyCount - a.vacancyCount;
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return sort === "newest" ? tb - ta : ta - tb;
    });

    return rows;
  }, [listings, query, category, businessType, sort]);

  const featuredIds = useMemo(
    () =>
      new Set(
        listings
          .filter((l) => l.isPinned || l.isFeatured)
          .map((l) => l.id),
      ),
    [listings],
  );

  const regular = useMemo(
    () => filtered.filter((l) => !featuredIds.has(l.id)),
    [filtered, featuredIds],
  );

  const activeFilters =
    (query ? 1 : 0) + (category ? 1 : 0) + (businessType ? 1 : 0);

  const countLabel =
    filtered.length === 0
      ? "немає"
      : filtered.length === 1
        ? "1 оголошення"
        : `${filtered.length} оголошень`;

  const quickFilters = horeca
    ? businessTypes.slice(0, 8).map((b) => ({ label: b, query: b.toLowerCase() }))
    : JOB_QUICK;

  function resetFilters() {
    setQuery("");
    setCategory("");
    setBusinessType("");
    setSort("newest");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="py-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Місто
          </h2>
          {cities.length > 0 && (
            <select
              value={citySlug ?? ""}
              onChange={(e) => {
                const slug = e.target.value;
                router.push(slug ? cityListingsPath(project, slug) : allHref);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-brand sm:hidden"
            >
              <option value="">Усі міста</option>
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <CityChips
          project={project}
          cities={cities}
          activeCity={citySlug}
          allHref={allHref}
          isHoreca={horeca}
        />
        <div className="mt-4">
          <CityGrid
            project={project}
            cities={cities}
            activeCity={citySlug}
            allHref={allHref}
            isHoreca={horeca}
          />
        </div>
      </section>

      <div className="mb-6">
        {horeca && <SavedListingsBar project={project} />}
        <TelegramBrowseBanner
          channels={telegramChannels}
          botUsername={botUsername}
          cityName={cityName}
        />
      </div>

      <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 -mx-4 border-y border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:mb-6 sm:rounded-2xl sm:border sm:px-5 sm:shadow-sm">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Посада, компанія, ключове слово…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`relative shrink-0 rounded-xl border px-3 py-2.5 text-sm font-medium transition active:scale-95 sm:hidden ${
              filtersOpen || activeFilters
                ? "border-brand bg-brand/5 text-brand"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            ⚙️
            {activeFilters > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        <div
          className={`${filtersOpen ? "mt-3 block" : "hidden"} space-y-3 sm:mt-4 sm:block`}
        >
          <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-hide">
            <div className="flex w-max gap-2 sm:flex-wrap sm:w-auto">
              {quickFilters.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    setQuery(query === item.query ? "" : item.query)
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                    query === item.query
                      ? "bg-brand text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {categories.length > 1 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">Усі категорії</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {horeca && businessTypes.length > 0 && (
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">Усі заклади</option>
                {businessTypes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="newest">Спочатку нові</option>
              <option value="oldest">Спочатку старі</option>
              <option value="vacancies">Більше вакансій</option>
            </select>

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-slate-500 hover:text-brand"
              >
                Скинути фільтри
              </button>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500 sm:text-sm">
          Знайдено: <span className="font-semibold text-slate-700">{countLabel}</span>
          {listings.length !== filtered.length && (
            <span> з {listings.length}</span>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        listings.length === 0 ? (
          <ListingsEmptyState project={project} cityName={cityName} />
        ) : (
          <div className="app-card mx-auto max-w-lg p-8 text-center">
            <p className="text-4xl">🔍</p>
            <h2 className="mt-3 text-lg font-bold text-slate-900">
              Нічого не знайдено
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Спробуйте інший запит або скиньте фільтри
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Скинути фільтри
            </button>
          </div>
        )
      ) : (
        <>
          <FeaturedListingsSection
            listings={filtered.filter((l) => featuredIds.has(l.id))}
            project={project}
            horeca={horeca}
          />
          <div className="grid gap-4 pb-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {regular.map((listing) =>
              horeca ? (
                <HorecaListingCard
                  key={listing.id}
                  listing={listing}
                  project={project}
                />
              ) : (
                <JobListingCard key={listing.id} listing={listing} project={project} />
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
