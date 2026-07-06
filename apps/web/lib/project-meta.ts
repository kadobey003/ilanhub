export type ProjectSlug = "jobs" | "horeca" | "auto";

export interface ProjectMeta {
  slug: ProjectSlug | string;
  title: string;
  subtitle: string;
  badge: string;
  emoji: string;
  gradient: string;
  accent: string;
  createHref: string;
}

const META: Record<string, ProjectMeta> = {
  jobs: {
    slug: "jobs",
    title: "Робота",
    subtitle: "Вакансії по всій Україні — офіс, IT, виробництво, логістика",
    badge: "💼 Вакансії",
    emoji: "💼",
    gradient: "from-blue-600 via-brand to-indigo-800",
    accent: "brand",
    createHref: "/create?project=jobs",
  },
  horeca: {
    slug: "horeca",
    title: "Horeca",
    subtitle: "Вакансії по всій Україні — ресторани, кафе, бари та готелі",
    badge: "🍽️ HoReCa",
    emoji: "🍽️",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    accent: "amber",
    createHref: "/create?project=horeca",
  },
  auto: {
    slug: "auto",
    title: "Авто",
    subtitle: "Продаж автомобілів по Україні",
    badge: "🚗 Авто",
    emoji: "🚗",
    gradient: "from-slate-700 via-slate-800 to-slate-900",
    accent: "slate",
    createHref: "/create?project=auto",
  },
};

export function getProjectMeta(slug: string): ProjectMeta {
  return (
    META[slug] ?? {
      slug,
      title: slug,
      subtitle: "Оголошення на UAREKLAMHUB",
      badge: "📋",
      emoji: "📋",
      gradient: "from-blue-600 via-brand to-indigo-800",
      accent: "brand",
      createHref: `/create?project=${slug}`,
    }
  );
}

export function isKnownProject(slug: string): slug is ProjectSlug {
  return slug in META;
}
