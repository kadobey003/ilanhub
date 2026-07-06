import type { ReactNode } from "react";
import {
  IconCard,
  IconChannel,
  IconChart,
  IconCity,
  IconDashboard,
  IconFolder,
  IconKey,
  IconListings,
  IconPricing,
  IconRocket,
  IconTelegram,
  IconUsers,
  IconTag,
} from "./components/icons";

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  superOnly?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Головне",
    items: [
      { to: "/", label: "Панель", icon: <IconDashboard size={18} /> },
      { to: "/listings", label: "Модерація", icon: <IconListings size={18} /> },
      { to: "/users", label: "Користувачі", icon: <IconUsers size={18} /> },
      { to: "/publications", label: "Дистрибуція", icon: <IconRocket size={18} /> },
    ],
  },
  {
    title: "Каталог",
    items: [
      { to: "/projects", label: "Проєкти", icon: <IconFolder size={18} /> },
      { to: "/cities", label: "Міста", icon: <IconCity size={18} /> },
      { to: "/pricing", label: "Каталог цін", icon: <IconPricing size={18} /> },
    ],
  },
  {
    title: "Канали",
    items: [
      { to: "/channels", label: "Канали", icon: <IconChannel size={18} /> },
      { to: "/telegram", label: "Telegram", icon: <IconTelegram size={18} /> },
    ],
  },
  {
    title: "Фінанси",
    items: [
      { to: "/payments", label: "Платежі", icon: <IconCard size={18} /> },
      { to: "/analytics", label: "Аналітика", icon: <IconChart size={18} /> },
    ],
  },
  {
    title: "Система",
    items: [
      { to: "/branding", label: "Брендинг", icon: <IconTag size={18} /> },
      { to: "/managers", label: "Менеджери", icon: <IconKey size={18} />, superOnly: true },
    ],
  },
];

export const pageTitles: Record<string, string> = {
  "/": "Панель керування",
  "/listings": "Модерація оголошень",
  "/users": "Користувачі",
  "/pricing": "Каталог цін",
  "/projects": "Проєкти",
  "/categories": "Категорії",
  "/cities": "Міста",
  "/channels": "Канали",
  "/telegram": "Telegram",
  "/branding": "Брендинг",
  "/publications": "Дистрибуція",
  "/payments": "Платежі",
  "/analytics": "Аналітика",
  "/managers": "Менеджери",
};
