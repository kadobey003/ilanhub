import type { channelConfigs, listings, listingPositions } from "@ilanhub/database";
import type { BotVehicle } from "@ilanhub/shared";

export type Listing = typeof listings.$inferSelect;
export type ListingPosition = typeof listingPositions.$inferSelect;
export type ChannelConfig = typeof channelConfigs.$inferSelect;

export interface ListingPublishContext {
  listing: Listing;
  positions: ListingPosition[];
  media: { url: string; sortOrder: number }[];
  vehicle?: BotVehicle | null;
  project: { slug: string; name: string };
  category: { name: string } | null;
  city: { name: string } | null;
  district: { name: string } | null;
  publicBaseUrl: string;
}

export interface PublishResult {
  externalId: string;
}

export interface Publisher {
  publish(
    ctx: ListingPublishContext,
    channelConfig: ChannelConfig,
  ): Promise<PublishResult>;
}
