import { ListingWizard } from "@/components/ListingWizard";
import { HorecaWizard } from "@/components/horeca/HorecaWizard";
import { JobsWizard } from "@/components/jobs/JobsWizard";
import Link from "next/link";

export default async function CreateListingPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const labels: Record<string, string> = {
    jobs: "Робота",
    horeca: "Horeca",
    auto: "Авто",
  };
  const isHoreca = !project || project === "horeca";
  const isJobs = project === "jobs";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand">
        ← На головну
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        Подати оголошення
      </h1>
      {project && labels[project] && (
        <p className="mt-2 text-slate-600">
          Напрям:{" "}
          <span className="font-semibold text-brand">{labels[project]}</span>
        </p>
      )}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {isHoreca ? (
          <HorecaWizard />
        ) : isJobs ? (
          <JobsWizard />
        ) : (
          <ListingWizard initialProjectSlug={project} />
        )}
      </div>
    </div>
  );
}
