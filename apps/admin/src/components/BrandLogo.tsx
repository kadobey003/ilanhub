const BRAND_NAME = "UAREKLAMHUB";
const BRAND_LOGO_PATH = `${import.meta.env.BASE_URL}logo.png`.replace(
  /\/{2,}/g,
  "/",
);

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export function BrandLogo({ className = "brand-logo", size = 40 }: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_PATH}
      alt={BRAND_NAME}
      width={size}
      height={size}
      className={className}
    />
  );
}
