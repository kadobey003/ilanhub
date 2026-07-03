import postgres from "postgres";

const sql = postgres(
  process.env.DATABASE_URL ??
    "postgresql://ilanhub:secret@localhost:5432/ilanhub",
);

await sql`ALTER TABLE channel_configs ADD COLUMN IF NOT EXISTS name varchar(255)`;
console.log("channel_configs.name column OK");
await sql`ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true`;
console.log("cities.is_active column OK");
await sql.end();
