export type PublishPlatform = {
  id: "telegram" | "viber" | "whatsapp" | "instagram" | "web";
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  submitLabel: string;
};

export const PUBLISH_PLATFORMS: PublishPlatform[] = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    color: "#229ED9",
    gradient: "from-sky-500 to-blue-600",
    description: "Міські канали та бот для подачі оголошень",
    submitLabel: "Бот + канали",
  },
  {
    id: "viber",
    name: "Viber",
    icon: "💜",
    color: "#7360F2",
    gradient: "from-violet-500 to-purple-600",
    description: "Публікація у Viber-спільнотах та через бота",
    submitLabel: "Viber бот",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "💬",
    color: "#25D366",
    gradient: "from-green-500 to-emerald-600",
    description: "Розсилка в WhatsApp-каналах та бот",
    submitLabel: "WhatsApp бот",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    color: "#E4405F",
    gradient: "from-pink-500 to-rose-600",
    description: "Сторінки з вакансіями, Horeca та авто",
    submitLabel: "Сторінки",
  },
  {
    id: "web",
    name: "Сайт",
    icon: "🌐",
    color: "#2563eb",
    gradient: "from-blue-500 to-indigo-600",
    description: "Каталог на ilanhub.com з SEO та пошуком",
    submitLabel: "Веб-сайт",
  },
];

export type FallbackSocialPage = {
  id: string;
  name: string;
  handle: string;
  url: string;
  projectSlug: string;
  projectName: string;
  cities: string[];
};

/** Fallback when admin has not configured publication channels yet. */
export const FALLBACK_SOCIAL: Record<
  "instagram" | "viber" | "whatsapp" | "web",
  FallbackSocialPage[]
> = {
  instagram: [
    {
      id: "ig-jobs",
      name: "UAREKLAMHUB | Робота",
      handle: "@uareklamhub_jobs",
      url: "https://instagram.com/uareklamhub_jobs",
      projectSlug: "jobs",
      projectName: "Робота",
      cities: ["Київ", "Львів", "Одеса"],
    },
    {
      id: "ig-horeca",
      name: "UAREKLAMHUB | Horeca",
      handle: "@uareklamhub_horeca",
      url: "https://instagram.com/uareklamhub_horeca",
      projectSlug: "horeca",
      projectName: "Horeca",
      cities: ["Київ", "Львів"],
    },
    {
      id: "ig-auto",
      name: "UAREKLAMHUB | Авто",
      handle: "@uareklamhub_auto",
      url: "https://instagram.com/uareklamhub_auto",
      projectSlug: "auto",
      projectName: "Авто",
      cities: ["Вся Україна"],
    },
  ],
  viber: [
    {
      id: "vb-jobs",
      name: "UAREKLAMHUB Робота",
      handle: "Viber спільнота",
      url: "#nashi-kanaly",
      projectSlug: "jobs",
      projectName: "Робота",
      cities: ["Київ"],
    },
  ],
  whatsapp: [
    {
      id: "wa-jobs",
      name: "UAREKLAMHUB WhatsApp",
      handle: "WhatsApp канал",
      url: "#nashi-kanaly",
      projectSlug: "jobs",
      projectName: "Робота",
      cities: ["Вся Україна"],
    },
  ],
  web: [
    {
      id: "web-main",
      name: "ilanhub.com",
      handle: "ilanhub.com",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilanhub.com",
      projectSlug: "jobs",
      projectName: "Платформа",
      cities: ["Вся Україна"],
    },
  ],
};
