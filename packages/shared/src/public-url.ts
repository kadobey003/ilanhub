export function resolvePublicBaseUrl(
  menuSiteUrl?: string | null,
  envUrl?: string | null,
): string {
  const fromMenu = menuSiteUrl?.trim().replace(/\/$/, "");
  if (fromMenu) return fromMenu;

  const fromEnv = (envUrl ?? process.env.PUBLIC_URL)?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  return "https://ilanhub.com";
}

export function buildListingUrl(
  baseUrl: string,
  projectSlug: string,
  listingId: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/${projectSlug}/listing/${listingId}`;
}
