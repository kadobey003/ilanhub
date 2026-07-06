import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { PwaRegister } from "@/components/PwaRegister";
import { JsonLd } from "@/components/seo/JsonLd";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { DEFAULT_DESCRIPTION, getSiteUrl, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND_NAME} — Робота та вакансії в Україні`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  icons: {
    icon: BRAND_LOGO_PATH,
    apple: BRAND_LOGO_PATH,
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Робота та вакансії в Україні`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: BRAND_LOGO_PATH, alt: BRAND_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Робота та вакансії в Україні`,
    description: DEFAULT_DESCRIPTION,
    images: [BRAND_LOGO_PATH],
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
        <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
        <GoogleAnalytics />
        <PwaRegister />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
