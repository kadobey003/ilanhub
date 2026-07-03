import type { ChannelConfig, ListingPublishContext, Publisher, PublishResult } from "./types.js";

export const instagramPublisher: Publisher = {
  async publish(
    ctx: ListingPublishContext,
    channelConfig: ChannelConfig,
  ): Promise<PublishResult> {
    const config = channelConfig.config as Record<string, unknown>;
    const pageId = String(config.pageId ?? "stub");
    const externalId = `ig:${pageId}:${ctx.listing.id}`;
    return { externalId };
  },
};
