export const FREE_MONTH_PROMO = {
  id: "july-free-2026",
  endsAt: "2026-07-31T23:59:59+03:00",
  endsLabel: "31 липня 2026",
  title: "Усі оголошення безкоштовно",
  subtitle: "Публікуйте вакансії, Horeca та авто без оплати — до кінця липня",
  cta: "Подати безкоштовно",
  href: "/create",
};

export type PromoCampaign = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  cta: string;
  href: string;
  gradient: string;
  icon: string;
  sponsor?: string;
  endsAt?: string;
};

export type PlatformAnnouncement = {
  id: string;
  text: string;
  href?: string;
  type: "info" | "promo" | "urgent";
};

export type AdPlacement = {
  id: string;
  name: string;
  size: string;
  location: string;
  priceFrom: string;
  impressions: string;
  icon: string;
};

export type PromotionPackage = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  href: string;
};

export const TOP_PROMO = {
  id: FREE_MONTH_PROMO.id,
  text: `🎁 До ${FREE_MONTH_PROMO.endsLabel}: усі оголошення безкоштовно — робота, Horeca, авто`,
  href: "#bezplatno",
  cta: "Подати зараз",
};

export const ANNOUNCEMENTS: PlatformAnnouncement[] = [
  {
    id: "a-free",
    text: `Акція: публікація оголошень 0 ₴ до ${FREE_MONTH_PROMO.endsLabel}`,
    href: "#bezplatno",
    type: "urgent",
  },
  {
    id: "a1",
    text: "Робота, Horeca, авто — Telegram, Viber, WhatsApp та сайт",
    type: "info",
  },
  {
    id: "a2",
    text: "VIP-підсилення — виділення в топі стрічки від 299 ₴",
    href: "#pakety",
    type: "promo",
  },
  {
    id: "a3",
    text: "Реклама в Telegram-каналах: 50K+ підписників щодня",
    href: "#reklama",
    type: "promo",
  },
];

export const CAMPAIGNS: PromoCampaign[] = [
  {
    id: "c-free",
    title: "0 ₴ до кінця липня",
    description:
      "Базова публікація оголошень повністю безкоштовна: вакансії, Horeca, авто — усі канали платформи.",
    badge: "Акція",
    cta: "Подати безкоштовно",
    href: "/create",
    gradient: "from-emerald-500 to-teal-600",
    icon: "🎁",
    endsAt: FREE_MONTH_PROMO.endsLabel,
  },
  {
    id: "c1",
    title: "VIP-оголошення",
    description:
      "Ваше оголошення зверху стрічки, виділене кольором та з бейджем «Топ».",
    badge: "Популярне",
    cta: "Обрати пакет",
    href: "#pakety",
    gradient: "from-amber-500 to-orange-600",
    icon: "⭐",
  },
  {
    id: "c2",
    title: "Telegram-розсилка",
    description:
      "Публікація у всіх міських каналах платформи — Київ, Львів, Одеса та ін.",
    cta: "Замовити",
    href: "#reklama",
    gradient: "from-blue-500 to-indigo-600",
    icon: "📡",
    sponsor: "Партнерська пропозиція",
  },
  {
    id: "c3",
    title: "Банер на головній",
    description:
      "Преміум-місце на landing: ваш бренд бачать усі відвідувачі сайту.",
    badge: "Преміум",
    cta: "Забронювати",
    href: "#reklama",
    gradient: "from-violet-500 to-purple-700",
    icon: "🎯",
  },
];

export const AD_PLACEMENTS: AdPlacement[] = [
  {
    id: "hero-banner",
    name: "Головний банер",
    size: "970 × 250",
    location: "Landing, під Hero",
    priceFrom: "2 500 ₴",
    impressions: "~15K/міс",
    icon: "🖼️",
  },
  {
    id: "native-card",
    name: "Нативна картка",
    size: "300 × 250",
    location: "Стрічка оголошень",
    priceFrom: "800 ₴",
    impressions: "~8K/міс",
    icon: "📋",
  },
  {
    id: "telegram-post",
    name: "Пост у каналі",
    size: "Telegram",
    location: "Міські канали",
    priceFrom: "500 ₴",
    impressions: "50K+ охоп.",
    icon: "✈️",
  },
  {
    id: "sidebar",
    name: "Бічний блок",
    size: "160 × 600",
    location: "Сторінки каталогу",
    priceFrom: "1 200 ₴",
    impressions: "~5K/міс",
    icon: "📌",
  },
];

export const PROMOTION_PACKAGES: PromotionPackage[] = [
  {
    id: "boost",
    name: "Підсилення",
    price: "149",
    period: "7 днів",
    description: "Виділення оголошення серед інших у стрічці.",
    features: [
      "Кольорове виділення",
      "Бейдж «Актуальне»",
      "Пріоритет у пошуку",
      "1 канал Telegram",
    ],
    cta: "Обрати",
    href: "/create",
  },
  {
    id: "vip",
    name: "VIP",
    price: "299",
    period: "7 днів",
    description: "Максимальна видимість для швидкого результату.",
    features: [
      "Топ стрічки 7 днів",
      "Усі канали Telegram",
      "Viber + WhatsApp",
      "Значок «Топ»",
      "Пріоритетна модерація",
    ],
    highlighted: true,
    cta: "Найпопулярніше",
    href: "/create",
  },
  {
    id: "business",
    name: "Бізнес",
    price: "990",
    period: "30 днів",
    description: "Для компаній: бренд + кілька оголошень.",
    features: [
      "До 5 оголошень VIP",
      "Банер на landing 7 днів",
      "Логотип у профілі",
      "Персональний менеджер",
      "Звіт по охопленню",
    ],
    cta: "Зв'язатися",
    href: "#reklama",
  },
];

export function advertiseContactHref(botUsername?: string | null): string {
  const user = botUsername?.replace(/^@/, "");
  if (user) return `https://t.me/${user}?start=advertise`;
  return "#reklama";
}

export function daysUntilPromoEnd(endsAt: string): number {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}
