export type VerticalSlug = "robota" | "horeca" | "avto";

export const VERTICALS = {
  robota: {
    slug: "robota" as const,
    projectSlug: "jobs",
    accent: "blue",
    emoji: "💼",
    title: "Робота",
    tagline: "Знайдіть вакансію мрії",
    description:
      "Офіс, виробництво, IT, логістика — тисячі вакансій по всій Україні.",
  },
  horeca: {
    slug: "horeca" as const,
    projectSlug: "horeca",
    accent: "amber",
    emoji: "🍽️",
    title: "Horeca",
    tagline: "Ресторани, кафе, готелі",
    description:
      "Окремий напрям для HoReCa: бармени, кухарі, офіціанти, адміністратори.",
  },
  avto: {
    slug: "avto" as const,
    projectSlug: "auto",
    accent: "emerald",
    emoji: "🚗",
    title: "Авто",
    tagline: "Купівля та продаж авто",
    description: "Легкові, вантажні, мото — швидкий продаж по всій Україні.",
  },
} as const;
