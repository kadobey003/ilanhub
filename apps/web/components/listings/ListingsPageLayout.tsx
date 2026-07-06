import Link from "next/link";
import { CityChips } from "./CityChips";
import { ListingsEmptyState } from "./ListingsEmptyState";
import { JobListingCard } from "./JobListingCard";
import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { Button } from "@/components/ui/Button";
import { getProjectMeta } from "@/lib/project-meta";
import { isHorecaProject } from "@/lib/listings-api";
import type { CityOption } from "@/lib/cities";
import type { PublicListingSummary } from "@/lib/listings-types";

interface Props {
  project: string;
  listings: PublicListingSummary[];
  cities: CityOption[];
  citySlug?: string;
  cityName?: string;
}

export function ListingsPageLayout({
  project,
  listings,
  cities,
  citySlug,
  cityName,
}: Props) {
  const meta = getProjectMeta(project);
  const horeca = isHorecaProject(project);
  const allHref = `/${project}`;
  const countLabel =
    listings.length === 0
      ? "немає"
      : listings.length === 1
        ? "1 оголошення"
        : `${listings.length} оголошень`;

  return (
    <div className="pb-nav md:pb-8">
      <section className={`relative overflow-hidden app-gradient-hero text-white md:mx-4 md:mt-4 md:rounded-3xl`}>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.07]" />
        <div className="relative px-4 py-8 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <Link
              href={project === "jobs" ? "/jobs" : `/${project}`}
              className="text-sm text-white/70 hover:text-white"
            >
              ← {project === "jobs" ? "Усі вакансії" : meta.title}
            </Link>
            <span className="mt-4 mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {meta.badge}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              {cityName ? `${meta.title} — ${cityName}` : meta.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100/90 sm:text-base">
              {cityName
                ? `Актуальні вакансії у місті ${cityName}`
                : meta.subtitle}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                {countLabel}
              </span>
              <Button
                href={meta.createHref}
                variant="secondary"
                size="sm"
                className="!rounded-xl !bg-white !text-slate-900 hover:!bg-blue-50"
              >
                + Подати
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="py-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Місто
          </h2>
          <CityChips
            project={project}
            cities={cities}
            activeCity={citySlug}
            allHref={allHref}
          />
        </section>

        {listings.length === 0 ? (
          <ListingsEmptyState project={project} cityName={cityName} />
        ) : (
          <div className="grid gap-4 pb-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {listings.map((listing) =>
              horeca ? (
                <HorecaListingCard key={listing.id} listing={listing} project={project} />
              ) : (
                <JobListingCard key={listing.id} listing={listing} project={project} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
