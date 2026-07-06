import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getProjectMeta } from "@/lib/project-meta";

interface Props {
  project: string;
  cityName?: string;
}

export function ListingsEmptyState({ project, cityName }: Props) {
  const meta = getProjectMeta(project);

  return (
    <div className="app-card mx-auto max-w-lg p-8 text-center sm:p-10">
      <span className="text-5xl">{meta.emoji}</span>
      <h2 className="mt-4 text-xl font-bold text-slate-900">
        {cityName ? `У ${cityName} поки немає вакансій` : "Поки немає оголошень"}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {cityName
          ? "Спробуйте інше місто або подайте першу вакансію — ми опублікуємо в Telegram та на сайті."
          : "Будьте першими — подайте оголошення через сайт або Telegram-бота."}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button href={meta.createHref} size="lg" className="w-full sm:w-auto">
          Подати оголошення
        </Button>
        {cityName && (
          <Button href={`/${project}`} variant="outline" size="lg" className="w-full sm:w-auto">
            Усі міста
          </Button>
        )}
      </div>
      {project === "jobs" && (
        <p className="mt-6 text-sm text-slate-500">
          Ресторан або кафе?{" "}
          <Link href="/horeca" className="font-semibold text-brand hover:underline">
            Перейти в Horeca →
          </Link>
        </p>
      )}
    </div>
  );
}
