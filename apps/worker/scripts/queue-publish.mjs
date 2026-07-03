import { Queue } from "bullmq";

const listingId = process.argv[2] ?? "41332d7a-8657-4f9f-8d8f-7b2497014806";

const queue = new Queue("publish-listing", {
  connection: {
    url: process.env.REDIS_URL ?? "redis://localhost:6450",
    maxRetriesPerRequest: null,
  },
});

const job = await queue.add("publish", { listingId }, { jobId: `manual-${listingId}-${Date.now()}` });
console.log("Queued", job.id, listingId);
await queue.close();
process.exit(0);
