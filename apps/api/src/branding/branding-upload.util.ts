import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const LOGO_FILENAME = "logo.png";
const MAX_BYTES = 2 * 1024 * 1024;

function brandingDir(): string {
  return join(process.cwd(), "uploads", "branding");
}

export function brandingLogoPublicPath(version?: number): string {
  const v = version ?? Date.now();
  return `/api/uploads/branding/${LOGO_FILENAME}?v=${v}`;
}

export async function saveBrandingLogo(dataUrl: string): Promise<string> {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(dataUrl.trim());
  const raw = match?.[1] ?? dataUrl;
  const buffer = Buffer.from(raw, "base64");
  if (!buffer.length) throw new Error("Invalid image data");
  if (buffer.length > MAX_BYTES) throw new Error("Logo must be under 2 MB");

  const dir = brandingDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, LOGO_FILENAME), buffer);
  return brandingLogoPublicPath();
}
