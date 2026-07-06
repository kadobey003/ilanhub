import type { PublicListingDetail, PublicListingSummary } from "./listings-types";

export function formatListingDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "short",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function favoriteStorageKey(listingId: string): string {
  return `ilanhub:fav:${listingId}`;
}

export function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("ilanhub:favorites");
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function writeFavorites(ids: Set<string>): void {
  localStorage.setItem("ilanhub:favorites", JSON.stringify([...ids]));
}

export function rankRelatedListings(
  all: PublicListingSummary[],
  current: PublicListingDetail,
  limit = 8,
): PublicListingSummary[] {
  const currentTitles = new Set(
    current.positions.map((p) => p.title.toLowerCase()),
  );
  const currentCity = current.city?.slug ?? current.citySlug;

  const scored = all
    .filter((l) => l.id !== current.id)
    .map((listing) => {
      let score = 0;
      if (listing.citySlug && listing.citySlug === currentCity) score += 3;
      for (const title of listing.positionTitles ?? []) {
        if (currentTitles.has(title.toLowerCase())) score += 2;
      }
      if (listing.isPinned) score += 4;
      if (listing.isFeatured) score += 3;
      if (listing.businessType && listing.businessType === current.businessType) {
        score += 1;
      }
      return { listing, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.listing.publishedAt
        ? new Date(a.listing.publishedAt).getTime()
        : 0;
      const tb = b.listing.publishedAt
        ? new Date(b.listing.publishedAt).getTime()
        : 0;
      return tb - ta;
    });

  return scored.slice(0, limit).map((s) => s.listing);
}

export const CITY_ICONS: Record<string, string> = {
  kyiv: "🏛",
  lviv: "🦁",
  odesa: "⚓",
  kharkiv: "🏭",
  dnipro: "🌉",
  zaporizhzhia: "⚡",
};
