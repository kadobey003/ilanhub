import type { Metadata } from "next";
import { ListingWizard } from "@/components/ListingWizard";
import { HorecaWizard } from "@/components/horeca/HorecaWizard";
import { HorecaSellWizard } from "@/components/horeca/HorecaSellWizard";
import { JobsWizard } from "@/components/jobs/JobsWizard";
import { AutoWizard } from "@/components/auto/AutoWizard";
import { NOINDEX_METADATA } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = { ...NOINDEX_METADATA, title: "Подати оголошення" };

export default async function CreateListingPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; mode?: string }>;
}) {
  const { project, mode } = await searchParams;
  const labels: Record<string, string> = {
    jobs: "Робота",
    horeca: "Horeca",
    auto: "Авто",
  };
  const isHorecaSell = project === "horeca" && mode === "sell";
  const isHoreca = (!project || project === "horeca") && !isHorecaSell;
  const isJobs = project === "jobs";
  const isAuto = project === "auto";

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand">← На головну</Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">
        {isHorecaSell ? "Продати обладнання" : isAuto ? "Продати авто" : "Подати оголошення"}
      </h1>
      {project && labels[project] && (
        <p className="mt-2 text-slate-600">
          Напрям: <span className="font-semibold text-brand">{isHorecaSell ? "Horeca — продаж" : labels[project]}</span>
        </p>
      )}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        {isHorecaSell ? (
          <HorecaSellWizard />
        ) : isHoreca ? (
          <HorecaWizard />
        ) : isJobs ? (
          <JobsWizard />
        ) : isAuto ? (
          <AutoWizard />
        ) : (
          <ListingWizard initialProjectSlug={project} />
        )}
      </div>
    </div>
  );
}
