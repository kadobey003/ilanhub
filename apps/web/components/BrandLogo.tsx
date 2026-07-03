import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";

interface BrandLogoProps {
  className?: string;
  height?: number;
}

export function BrandLogo({ className = "", height = 32 }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_PATH}
      alt={BRAND_NAME}
      className={`object-contain ${className}`}
      style={{ height: `${height}px`, width: "auto", maxWidth: `${height * 2.5}px` }}
    />
  );
}
