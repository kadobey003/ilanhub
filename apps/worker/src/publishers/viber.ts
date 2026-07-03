import type { ChannelConfig, ListingPublishContext, Publisher, PublishResult } from "./types.js";

export const viberPublisher: Publisher = {
  async publish(
    ctx: ListingPublishContext,
    channelConfig: ChannelConfig,
  ): Promise<PublishResult> {
    const config = channelConfig.config as Record<string, unknown>;
    const receiver = String(config.receiver ?? "stub");
    const externalId = `vb:${receiver}:${ctx.listing.id}`;
    return { externalId };
  },
};
