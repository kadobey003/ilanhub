import type { ChannelConfig, ListingPublishContext, Publisher, PublishResult } from "./types.js";

export const whatsappPublisher: Publisher = {
  async publish(
    ctx: ListingPublishContext,
    channelConfig: ChannelConfig,
  ): Promise<PublishResult> {
    const config = channelConfig.config as Record<string, unknown>;
    const phoneNumberId = String(config.phoneNumberId ?? "stub");
    const externalId = `wa:${phoneNumberId}:${ctx.listing.id}`;
    return { externalId };
  },
};
