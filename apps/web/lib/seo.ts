import type { Metadata } from "next";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";
import type { PublicListingDetail } from "./listings-types";

export const DEFAULT_DESCRIPTION =
  "Вакансії по всій Україні. Подайте оголошення через Telegram, Viber, WhatsApp або сайт. Horeca, офіс, IT, авто.";

export const OG_IMAGE = BRAND_LOGO_PATH;

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.PUBLIC_URL ??
    "https://ilanhub.com"
  ).replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = getSiteUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
  ogImage?: string | null;
  ogType?: "website" | "article";
  absoluteTitle?: boolean;
}): Metadata {
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(opts.path);
  const image = opts.ogImage ?? OG_IMAGE;
  const title = opts.absoluteTitle ? { absolute: opts.title } : opts.title;

  return {
    title,
    description,
    alternates: { canonical },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: opts.ogType ?? "website",
      locale: "uk_UA",
      siteName: BRAND_NAME,
      title: opts.title,
      description,
      url: canonical,
      images: image ? [{ url: absoluteUrl(image), alt: opts.title }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: opts.title,
      description,
      images: image ? [absoluteUrl(image)] : [],
    },
  };
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: true },
};

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url,
    logo: absoluteUrl(BRAND_LOGO_PATH),
    sameAs: [] as string[],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: getSiteUrl(),
    inLanguage: "uk-UA",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/jobs/kyiv/ogoloshennya?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function jobPostingJsonLd(listing: PublicListingDetail) {
  const position = listing.positions[0];
  const title =
    position?.title ?? listing.firstVacancyTitle ?? listing.title ?? "Вакансія";
  const description =
    position?.description ??
    listing.description ??
    listing.firstVacancyTitle ??
    title;

  const posting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    datePosted: listing.publishedAt ?? undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: listing.title ?? BRAND_NAME,
    },
    jobLocation: listing.city
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: listing.city.name,
            addressCountry: "UA",
          },
        }
      : {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressCountry: "UA" },
        },
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: BRAND_NAME,
      value: listing.id,
    },
  };

  if (position?.salary) {
    posting.baseSalary = {
      "@type": "MonetaryAmount",
      currency: listing.currency ?? "UAH",
      value: { "@type": "QuantitativeValue", value: position.salary },
    };
  }

  if (listing.imageUrl) {
    posting.image = listing.imageUrl.startsWith("http")
      ? listing.imageUrl
      : absoluteUrl(listing.imageUrl);
  }

  return posting;
}

export function itemListJsonLd(opts: {
  name: string;
  path: string;
  items: { name: string; path: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: absoluteUrl(opts.path),
    itemListElement: opts.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
