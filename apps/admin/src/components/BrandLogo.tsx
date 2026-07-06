import { useEffect, useState } from "react";

const BRAND_NAME = "UAREKLAMHUB";
const BRAND_LOGO_PATH = "/logo.png";
const FALLBACK_LOGO = `${import.meta.env.BASE_URL}logo.png`.replace(/\/{2,}/g, "/");

interface BrandLogoProps {
  className?: string;
  size?: number;
}

type Branding = { brandName: string; logoUrl: string };

export function BrandLogo({ className = "brand-logo", size = 40 }: BrandLogoProps) {
  const [branding, setBranding] = useState<Branding>({
    brandName: BRAND_NAME,
    logoUrl: FALLBACK_LOGO,
  });

  useEffect(() => {
    fetch("/api/site/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { data?: Branding } | null) => {
        if (body?.data) {
          setBranding({
            brandName: body.data.brandName,
            logoUrl: body.data.logoUrl.startsWith("/api/")
              ? body.data.logoUrl
              : body.data.logoUrl.startsWith("/")
                ? body.data.logoUrl
                : FALLBACK_LOGO,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const src =
    branding.logoUrl === BRAND_LOGO_PATH ? FALLBACK_LOGO : branding.logoUrl;

  return (
    <img
      src={src}
      alt={branding.brandName}
      width={size}
      height={size}
      className={className}
    />
  );
}
