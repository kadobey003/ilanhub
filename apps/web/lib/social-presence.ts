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
