import type { ChannelConfig, ListingPublishContext, Publisher, PublishResult } from "./types.js";

export const webPublisher: Publisher = {
  async publish(
    ctx: ListingPublishContext,
    channelConfig: ChannelConfig,
  ): Promise<PublishResult> {
    const config = channelConfig.config as Record<string, unknown>;
    const baseUrl = String(config.baseUrl ?? process.env.PUBLIC_URL ?? "https://ilanhub.com");
    const externalId = `${baseUrl}/${ctx.project.slug}/listing/${ctx.listing.id}`;
    return { externalId };
  },
};
