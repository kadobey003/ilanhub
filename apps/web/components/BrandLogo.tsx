"use client";

import { useEffect, useState } from "react";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";
import { PUBLIC_API_URL } from "@/lib/api-url";

interface BrandLogoProps {
  className?: string;
  height?: number;
}

type Branding = { brandName: string; logoUrl: string };

export function BrandLogo({ className = "", height = 32 }: BrandLogoProps) {
  const [branding, setBranding] = useState<Branding>({
    brandName: BRAND_NAME,
    logoUrl: BRAND_LOGO_PATH,
  });

  useEffect(() => {
    const base = PUBLIC_API_URL || "";
    fetch(`${base}/api/site/branding`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { data?: Branding } | null) => {
        if (body?.data) setBranding(body.data);
      })
      .catch(() => undefined);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={branding.logoUrl}
      alt={branding.brandName}
      className={`object-contain ${className}`}
      style={{ height: `${height}px`, width: "auto", maxWidth: `${height * 2.5}px` }}
    />
  );
}
