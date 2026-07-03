import { createDb } from "@ilanhub/database";
import { sql } from "drizzle-orm";

const db = createDb(
  process.env.DATABASE_URL ??
    "postgresql://ilanhub:secret@localhost:5432/ilanhub",
);

const statements = [
  `ALTER TABLE channel_configs ADD COLUMN IF NOT EXISTS name varchar(255)`,
  `CREATE TABLE IF NOT EXISTS districts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    slug varchar(64) NOT NULL,
    name varchar(255) NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true
  )`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES districts(id)`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS business_type varchar(128)`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS address text`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS vacancy_type_id uuid`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS description text`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS salary varchar(128)`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS working_hours varchar(128)`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS price integer`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0`,
  `ALTER TABLE listing_positions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()`,
];

for (const stmt of statements) {
  await db.execute(sql.raw(stmt));
  console.log("OK:", stmt.slice(0, 60));
}

process.exit(0);
