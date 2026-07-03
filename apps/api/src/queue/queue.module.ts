import { Global, Module } from "@nestjs/common";
import { Queue } from "bullmq";
import { PUBLISH_LISTING_QUEUE } from "../common/constants.js";

export const PUBLISH_LISTING_QUEUE_NAME = "publish-listing";

export interface PublishListingJob {
  listingId: string;
}

const redisConnection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6450",
  maxRetriesPerRequest: null,
};

@Global()
@Module({
  providers: [
    {
      provide: PUBLISH_LISTING_QUEUE,
      useFactory: () => {
        return new Queue<PublishListingJob>(PUBLISH_LISTING_QUEUE_NAME, {
          connection: redisConnection,
        });
      },
    },
  ],
  exports: [PUBLISH_LISTING_QUEUE],
})
export class QueueModule {}
