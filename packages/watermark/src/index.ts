import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const pkgDir = dirname(fileURLToPath(import.meta.url));

export interface WatermarkOptions {
  title?: string | null;
  logoPath?: string;
}

function defaultLogoPath(): string {
  const fromEnv = process.env.HORECA_LOGO_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  return join(pkgDir, "../assets/logo.png");
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function titleBannerSvg(width: number, title: string): Buffer {
  const label = escapeXml(title.trim().toUpperCase());
  const fontSize = Math.max(28, Math.round(width * 0.085));
  const height = Math.round(fontSize * 1.8);
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <text x="50%" y="72%" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}" font-weight="700"
    fill="#ffffff" filter="url(#shadow)">${label}</text>
</svg>`);
}

let cachedLogoPath: string | null = null;
let cachedLogoBuffer: Buffer | null = null;

function loadLogo(customPath?: string): Buffer {
  const path = customPath ?? defaultLogoPath();
  if (cachedLogoPath !== path || !cachedLogoBuffer) {
    cachedLogoBuffer = readFileSync(path);
    cachedLogoPath = path;
  }
  return cachedLogoBuffer;
}

export function isWatermarkEnabled(): boolean {
  const flag = process.env.HORECA_WATERMARK?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  return true;
}

export function resolveWatermarkLogoPath(): string {
  return defaultLogoPath();
}

export async function applyHorecaWatermark(
  input: Buffer,
  opts: WatermarkOptions = {},
): Promise<Buffer> {
  const base = sharp(input).rotate();
  const meta = await base.metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 800;

  const pad = Math.round(Math.min(width, height) * 0.025);
  const logoSize = Math.round(width * 0.17);
  const logo = await sharp(loadLogo(opts.logoPath))
    .resize(logoSize, logoSize, { fit: "cover" })
    .png()
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [
    { input: logo, top: pad, left: pad },
  ];

  if (opts.title?.trim()) {
    const banner = titleBannerSvg(width, opts.title);
    const bannerPng = await sharp(banner).png().toBuffer();
    const bannerMeta = await sharp(bannerPng).metadata();
    const bannerH = bannerMeta.height ?? Math.round(width * 0.12);
    composites.push({
      input: bannerPng,
      top: Math.max(0, height - bannerH - pad),
      left: 0,
    });
  }

  return base
    .composite(composites)
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
