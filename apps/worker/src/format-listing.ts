import {
  HORECA_SOURCE_PRODUCT,
  buildAutoTitle,
  buildListingUrl,
  formatAutoPostHtml,
  formatHorecaPostHtml,
  formatHorecaProductPostHtml,
  formatJobsPostHtml,
  parseStoredPosition,
  parseStoredProduct,
} from "@ilanhub/shared";
import type { ListingPublishContext } from "./publishers/types.js";

export function formatTelegramListing(ctx: ListingPublishContext): string {
  const { listing, positions, city, district, project } = ctx;
  const baseUrl = ctx.publicBaseUrl ?? "https://ilanhub.com";
  const siteUrl = buildListingUrl(baseUrl, project.slug, listing.id);

  const input = {
    businessType: listing.businessType,
    title: listing.title ?? (project.slug === "jobs" ? "Компанія" : "Заклад"),
    address: listing.address,
    city: city?.name,
    district: district?.name,
    contactPhone: listing.contactPhone,
    benefits: listing.description,
    positions: positions.map(parseStoredPosition),
    siteUrl,
  };

  if (project.slug === "jobs") {
    return formatJobsPostHtml(input);
  }

  if (project.slug === "auto" && ctx.vehicle) {
    return formatAutoPostHtml({
      title: listing.title ?? buildAutoTitle(ctx.vehicle),
      vehicle: ctx.vehicle,
      city: city?.name,
      description: listing.description,
      contactPhone: listing.contactPhone,
      siteUrl,
    });
  }

  if (listing.sourceStep === HORECA_SOURCE_PRODUCT) {
    return formatHorecaProductPostHtml({
      businessType: listing.businessType,
      title: listing.title ?? "Заклад",
      address: listing.address,
      city: city?.name,
      district: district?.name,
      contactPhone: listing.contactPhone,
      products: positions.map(parseStoredProduct),
      siteUrl,
    });
  }

  return formatHorecaPostHtml(input);
}
