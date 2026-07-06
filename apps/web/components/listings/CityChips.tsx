"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cityListingsPath } from "@/lib/cities";
import type { CityOption } from "@/lib/cities";

interface Props {
  project: string;
  cities: CityOption[];
  activeCity?: string;
  allHref: string;
  isHoreca?: boolean;
}

export function CityChips({ project, cities, activeCity, allHref, isHoreca }: Props) {
  const pathname = usePathname();

  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 pb-1 sm:flex-wrap sm:w-auto">
        <Chip href={allHref} active={!activeCity && pathname === allHref} isHoreca={isHoreca}>
          Усі міста
        </Chip>
        {cities.map((city) => (
          <Chip
            key={city.slug}
            href={cityListingsPath(project, city.slug)}
            active={activeCity === city.slug}
            isHoreca={isHoreca}
          >
            {city.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  href,
  active,
  isHoreca,
  children,
}: {
  href: string;
  active: boolean;
  isHoreca?: boolean;
  children: React.ReactNode;
}) {
  const activeCls = isHoreca
    ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/25"
    : "border-brand bg-brand text-white shadow-md shadow-brand/25";

  return (
    <Link
      href={href}
      className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95 ${
        active
          ? activeCls
          : "border-slate-200 bg-white text-slate-700 hover:border-brand/50 hover:text-brand"
      }`}
    >
      {children}
    </Link>
  );
}
