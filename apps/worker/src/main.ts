import { Worker } from "bullmq";
import { createDb } from "@ilanhub/database";
import { PublishService } from "./publish.service.js";

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6450",
  maxRetriesPerRequest: null,
};

const db = createDb(
  process.env.DATABASE_URL ??
    "postgresql://ilanhub:secret@localhost:5432/ilanhub",
);
const publishService = new PublishService(db);

const QUEUE_NAME = "publish-listing";

const worker = new Worker<{ listingId: string }>(
  QUEUE_NAME,
  async (job) => publishService.publishListing(job.data.listingId),
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Published listing ${job.data.listingId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log(`Worker listening on queue: ${QUEUE_NAME}`);
