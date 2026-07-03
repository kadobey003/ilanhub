import {
  formatHorecaPostHtml,
  parseStoredPosition,
} from "@ilanhub/shared";
import type { ListingPublishContext } from "./publishers/types.js";

export function formatTelegramListing(ctx: ListingPublishContext): string {
  const { listing, positions, city, district } = ctx;
  const siteUrl = process.env.PUBLIC_URL ?? "https://ilanhub.com";

  return formatHorecaPostHtml({
    businessType: listing.businessType,
    title: listing.title ?? "Заклад",
    address: listing.address,
    city: city?.name,
    district: district?.name,
    contactPhone: listing.contactPhone,
    benefits: listing.description,
    positions: positions.map(parseStoredPosition),
    siteUrl: `${siteUrl}/${ctx.project.slug}/listing/${listing.id}`,
  });
}
