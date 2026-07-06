import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { applyAutoWatermark, isAutoWatermarkEnabled } from "@ilanhub/watermark";

function uploadsDir(): string {
  return process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads", "listings");
}

export function listingUploadPublicUrl(filename: string): string {
  const base = process.env.PUBLIC_URL ?? process.env.API_URL ?? "http://localhost:3010";
  return `${base.replace(/\/$/, "")}/api/uploads/listings/${filename}`;
}

export async function saveWebListingPhoto(
  dataUrl: string,
  opts?: { watermarkTitle?: string | null },
): Promise<string> {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(dataUrl.trim());
  const raw = match?.[1] ?? dataUrl;
  let buffer: Buffer = Buffer.from(raw, "base64");
  if (!buffer.length) throw new Error("Invalid image data");

  if (opts?.watermarkTitle && isAutoWatermarkEnabled()) {
    buffer = Buffer.from(await applyAutoWatermark(buffer, { title: opts.watermarkTitle }));
  }

  const name = `${randomUUID()}.jpg`;
  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buffer);
  return listingUploadPublicUrl(name);
}
