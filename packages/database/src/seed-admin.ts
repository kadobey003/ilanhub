import { createDb } from "./index.js";
import { adminManagers } from "./schema/index.js";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

export async function seedAdmin(connectionString: string) {
  const db = createDb(connectionString);
  const [existing] = await db.select().from(adminManagers).limit(1);
  if (existing) {
    console.log("Admin zaten var:", existing.email);
    return;
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@ilanhub.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const hash = await hashPassword(password);

  await db.insert(adminManagers).values({
    email,
    passwordHash: hash,
    name: "Super Admin",
    role: "super_admin",
  });

  console.log("Admin oluşturuldu:", email, "/", password);
}

const url =
  process.env.DATABASE_URL ??
  "postgresql://ilanhub:secret@localhost:5432/ilanhub";

seedAdmin(url)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
