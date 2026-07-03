import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

function uploadsDir(): string {
  return process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads", "listings");
}

export function listingUploadPublicUrl(filename: string): string {
  const base = process.env.PUBLIC_URL ?? process.env.API_URL ?? "http://localhost:3010";
  return `${base.replace(/\/$/, "")}/api/uploads/listings/${filename}`;
}

export async function saveWebListingPhoto(dataUrl: string): Promise<string> {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(dataUrl.trim());
  const raw = match?.[1] ?? dataUrl;
  const buffer = Buffer.from(raw, "base64");
  if (!buffer.length) throw new Error("Invalid image data");

  const name = `${randomUUID()}.jpg`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buffer);
  return listingUploadPublicUrl(name);
}
