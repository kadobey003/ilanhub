import Link from "next/link";
import { cityListingsPath } from "@/lib/cities";
import { CITY_ICONS } from "@/lib/listing-utils";
import type { CityOption } from "@/lib/cities";

interface Props {
  project: string;
  cities: CityOption[];
  activeCity?: string;
  allHref: string;
  isHoreca?: boolean;
}

export function CityGrid({ project, cities, activeCity, allHref, isHoreca }: Props) {
  const activeRing = isHoreca ? "ring-amber-400" : "ring-brand";

  return (
    <div className="hidden gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-4">
      <Link
        href={allHref}
        className={`group flex flex-col items-center rounded-2xl border bg-white p-4 text-center shadow-sm transition hover:shadow-md ${
          !activeCity ? `ring-2 ${activeRing}` : "border-slate-200"
        }`}
      >
        <span className="text-2xl">🇺🇦</span>
        <span className="mt-2 text-sm font-semibold text-slate-900">Усі міста</span>
      </Link>
      {cities.map((city) => (
        <Link
          key={city.slug}
          href={cityListingsPath(project, city.slug)}
          className={`group flex flex-col items-center rounded-2xl border bg-white p-4 text-center shadow-sm transition hover:shadow-md ${
            activeCity === city.slug ? `ring-2 ${activeRing}` : "border-slate-200"
          }`}
        >
          <span className="text-2xl">{CITY_ICONS[city.slug] ?? "📍"}</span>
          <span className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-brand">
            {city.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
