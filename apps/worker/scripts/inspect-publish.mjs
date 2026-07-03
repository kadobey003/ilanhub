import { createDb, listings, channelPublications, channelConfigs } from "@ilanhub/database";
import { desc, eq } from "drizzle-orm";
import { Queue } from "bullmq";

const db = createDb(
  process.env.DATABASE_URL ??
    "postgresql://ilanhub:secret@localhost:5432/ilanhub",
);

const rows = await db
  .select({
    id: listings.id,
    title: listings.title,
    status: listings.status,
    updatedAt: listings.updatedAt,
  })
  .from(listings)
  .orderBy(desc(listings.updatedAt))
  .limit(8);

console.log("=== Recent listings ===");
for (const r of rows) {
  console.log(r.id, r.status, r.title?.slice(0, 40));
}

const target = rows.find((r) => r.id.startsWith("2b89dfc5")) ?? rows[0];
if (target) {
  const pubs = await db
    .select()
    .from(channelPublications)
    .where(eq(channelPublications.listingId, target.id));
  console.log("\n=== Publications for", target.id, "===");
  for (const p of pubs) {
    console.log(p.status, p.externalId, p.errorMessage);
  }
}

const channels = await db.select().from(channelConfigs);
console.log("\n=== Channel configs ===");
for (const c of channels) {
  console.log(c.channel, c.purpose, c.isActive, JSON.stringify(c.config));
}

const queue = new Queue("publish-listing", {
  connection: {
    url: process.env.REDIS_URL ?? "redis://localhost:6450",
    maxRetriesPerRequest: null,
  },
});

const [waiting, active, failed, delayed] = await Promise.all([
  queue.getWaitingCount(),
  queue.getActiveCount(),
  queue.getFailedCount(),
  queue.getDelayedCount(),
]);
console.log("\n=== Queue publish-listing ===", {
  waiting,
  active,
  failed,
  delayed,
});

const failedJobs = await queue.getFailed(0, 5);
if (failedJobs.length) {
  console.log("\n=== Recent failed jobs ===");
  for (const j of failedJobs) {
    console.log(j.id, j.data, j.failedReason);
  }
}

await queue.close();
process.exit(0);
