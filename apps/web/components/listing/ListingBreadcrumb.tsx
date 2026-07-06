import Link from "next/link";
import { cityListingsPath, projectAllListingsPath } from "@/lib/cities";
import { getProjectMeta } from "@/lib/project-meta";

interface Props {
  project: string;
  listingTitle: string;
  city?: { name: string; slug: string } | null;
}

export function ListingBreadcrumb({ project, listingTitle, city }: Props) {
  const meta = getProjectMeta(project);
  const landingHref = project === "jobs" ? "/jobs" : `/${project}`;
  const allHref = projectAllListingsPath(project);

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500"
    >
      <Link href={landingHref} className="hover:text-brand">
        {meta.title}
      </Link>
      <span className="text-slate-300">/</span>
      {city ? (
        <>
          <Link
            href={cityListingsPath(project, city.slug)}
            className="hover:text-brand"
          >
            {city.name}
          </Link>
          <span className="text-slate-300">/</span>
        </>
      ) : (
        <>
          <Link href={allHref} className="hover:text-brand">
            Оголошення
          </Link>
          <span className="text-slate-300">/</span>
        </>
      )}
      <span className="line-clamp-1 font-medium text-slate-800">{listingTitle}</span>
    </nav>
  );
}
