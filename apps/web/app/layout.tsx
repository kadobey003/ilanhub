import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin", "cyrillic-ext"],
  variable: "--font-sans",
  display: "swap",
});

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={sans.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
