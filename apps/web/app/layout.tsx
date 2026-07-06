import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { PwaRegister } from "@/components/PwaRegister";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1d4ed8" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — Оголошення в Україні`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Робота, Horeca, авто — подайте оголошення через Telegram, Viber, WhatsApp або сайт.",
  icons: {
    icon: BRAND_LOGO_PATH,
    apple: BRAND_LOGO_PATH,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={sans.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <PwaRegister />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
