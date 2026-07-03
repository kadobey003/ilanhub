/**
 * Test Horeca Telegram publish to a group/channel.
 * Usage: npx tsx scripts/test-horeca-telegram.ts [-1004475927547]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { and, eq } from "drizzle-orm";
import {
  categories,
  channelConfigs,
  cities,
  createDb,
  listings,
  listingMedia,
  listingPositions,
  projects,
  users,
} from "@ilanhub/database";
import { PublishService } from "../src/publish.service.js";

const CHAT_ID = process.argv[2] ?? "-1004475927547";
const TESTING_COUNT = Math.max(1, Number(process.argv[3] ?? 2));

function loadEnv() {
  const envPath = resolve(process.cwd(), "../../.env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1]!.trim();
    const val = m[2]!.trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnv();

  const db = createDb(
    process.env.DATABASE_URL ??
      "postgresql://ilanhub:secret@localhost:5432/ilanhub",
  );

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, "horeca"))
    .limit(1);
  if (!project) {
    console.error("Horeca project not found. Run pnpm db:seed");
    process.exit(1);
  }

  const tokenRows = await db
    .select()
    .from(channelConfigs)
    .where(
      and(
        eq(channelConfigs.projectId, project.id),
        eq(channelConfigs.channel, "telegram"),
        eq(channelConfigs.purpose, "listing_input"),
      ),
    );
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    String(
      (tokenRows.find((r) => r.isActive)?.config as Record<string, unknown>)
        ?.botToken ?? "",
    );
  if (!botToken) {
    console.error("No TELEGRAM_BOT_TOKEN in .env or admin Telegram settings");
    process.exit(1);
  }
  process.env.TELEGRAM_BOT_TOKEN = botToken;

  let [pubChannel] = await db
    .select()
    .from(channelConfigs)
    .where(
      and(
        eq(channelConfigs.projectId, project.id),
        eq(channelConfigs.channel, "telegram"),
        eq(channelConfigs.purpose, "publication"),
      ),
    )
    .limit(1);

  if (pubChannel) {
    const [updated] = await db
      .update(channelConfigs)
      .set({
        name: pubChannel.name ?? "Horeca Telegram",
        config: { ...(pubChannel.config as object), channelId: CHAT_ID },
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(channelConfigs.id, pubChannel.id))
      .returning();
    pubChannel = updated!;
    console.log("Updated publication channel:", pubChannel.id, CHAT_ID);
  } else {
    const [created] = await db
      .insert(channelConfigs)
      .values({
        projectId: project.id,
        channel: "telegram",
        purpose: "publication",
        name: "Horeca Telegram",
        config: { channelId: CHAT_ID },
        isActive: true,
      })
      .returning();
    pubChannel = created!;
    console.log("Created publication channel:", pubChannel.id);
  }

  const testCases = [
    {
      title: "Татар Бунар",
      businessType: "ресторан",
      address: "вул. Леонтовича, 13",
      description:
        "- навчаємо, допомагаємо зростати\n- висока та вчасна оплата\n- смачне харчування та форма\n- дружня команда 🤗",
      contactPhone: "+38 (068) 662 93 57",
      photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      positions: [
        {
          title: "Су шеф",
          salary: "2000 грн. ставка\n+2% від каси",
          workingHours: "4/2, 5/2, 12 годин",
          description: "Досвід: від 2 років",
          sortOrder: 1,
        },
        {
          title: "Гарячий цех",
          salary: "1800 грн. ставка",
          workingHours: "5/2, 10 годин",
          description: "Досвід: від 1 року",
          sortOrder: 2,
        },
      ],
    },
    {
      title: "Alaska",
      businessType: "ресторан",
      address: "вул. Хрещатик, 22",
      description:
        "- офіційне оформлення\n- кар'єрний ріст\n- зручний графік\n- дружній колектив",
      contactPhone: "+38 (050) 123 45 67",
      photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      positions: [
        {
          title: "Офіціант",
          salary: "25000 грн на місяць + чайові",
          workingHours: "2/2, 10 годин",
          description: "Досвід: від 6 місяців",
          sortOrder: 1,
        },
        {
          title: "Бармен",
          salary: "30000 грн + бонуси",
          workingHours: "5/2, 8 годин",
          description: "Досвід: від 1 року",
          sortOrder: 2,
        },
      ],
    },
  ];

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.projectId, project.id))
    .limit(1);
  const [city] = await db.select().from(cities).limit(1);
  let [user] = await db.select().from(users).limit(1);
  if (!user) {
    [user] = await db
      .insert(users)
      .values({ name: "Test User", telegramId: "test" })
      .returning();
  }
  if (!category || !city || !user) {
    console.error("Missing seed data (category/city/user)");
    process.exit(1);
  }

  const service = new PublishService(db);
  const published: string[] = [];

  for (let i = 0; i < Math.min(TESTING_COUNT, testCases.length); i++) {
    const tc = testCases[i]!;
    const [listing] = await db
      .insert(listings)
      .values({
        projectId: project.id,
        categoryId: category.id,
        cityId: city.id,
        userId: user.id,
        status: "approved",
        title: tc.title,
        businessType: tc.businessType,
        address: tc.address,
        description: tc.description,
        contactPhone: tc.contactPhone,
        sourceChannel: "telegram",
      })
      .returning();

    await db.insert(listingPositions).values(
      tc.positions.map((p) => ({ ...p, listingId: listing!.id })),
    );
    await db.insert(listingMedia).values({
      listingId: listing!.id,
      url: tc.photo,
      sortOrder: 0,
    });

    console.log(`\n--- Test ${i + 1}: ${tc.title} (${listing!.id}) ---`);
    const result = await service.publishListing(listing!.id);
    console.log(JSON.stringify(result, null, 2));

    const failed = result.channels.filter((c) => c.status === "rejected");
    if (failed.length) {
      console.error("Publish failed:", failed);
      process.exit(1);
    }
    published.push(listing!.id);
  }

  console.log(`\nPublished ${published.length} test(s) to Telegram group ${CHAT_ID}`);
  console.log("Listing IDs:", published.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
