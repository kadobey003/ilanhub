import { HorecaListingCard } from "@/components/horeca/HorecaListingCard";
import { ListingCard } from "@/components/ListingCard";
import { fetchProjectListings, isHorecaProject } from "@/lib/listings-api";
import type { PublicListingSummary } from "@/lib/listings-types";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const listings = await fetchProjectListings(project);
  const horeca = isHorecaProject(project);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold capitalize text-slate-900 sm:text-3xl">
          {horeca ? "Horeca — вакансії" : project}
        </h1>
        {horeca && (
          <p className="mt-2 text-slate-600">
            Оголошення для ресторанів, кафе, барів та готелів
          </p>
        )}
      </header>

      {listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          Поки немає оголошень
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l: PublicListingSummary) =>
            horeca ? (
              <HorecaListingCard key={l.id} listing={l} project={project} />
            ) : (
              <ListingCard
                key={l.id}
                id={l.id}
                project={project}
                title={l.title ?? ""}
                city={l.cityName ?? undefined}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
