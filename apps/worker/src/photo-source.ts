import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { resolveTelegramPhotoRef } from "./telegram-api.js";

type TgFileResponse = {
  ok: boolean;
  result?: { file_path?: string };
  description?: string;
};

function uploadFilenameFromUrl(url: string): string | null {
  const match = url.match(/\/api\/uploads\/listings\/([^/?#]+)$/i);
  return match?.[1] ?? null;
}

function localUploadCandidates(filename: string): string[] {
  const dirs = [
    process.env.UPLOADS_DIR,
    join(process.cwd(), "uploads", "listings"),
    join(process.cwd(), "..", "api", "uploads", "listings"),
    join(process.cwd(), "..", "..", "apps", "api", "uploads", "listings"),
  ].filter((d): d is string => Boolean(d?.trim()));

  return dirs.map((dir) => join(dir, filename));
}

async function readLocalUpload(filename: string): Promise<Buffer | null> {
  for (const path of localUploadCandidates(filename)) {
    try {
      return await readFile(path);
    } catch {
      // try next path
    }
  }
  return null;
}

async function fetchHttpPhoto(url: string): Promise<Buffer> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  } catch {
    // fall through to local / API fallback
  }

  const filename = uploadFilenameFromUrl(url);
  if (filename) {
    const local = await readLocalUpload(filename);
    if (local) return local;

    const apiBase = (process.env.API_URL ?? "http://localhost:3010").replace(
      /\/$/,
      "",
    );
    const localUrl = `${apiBase}/api/uploads/listings/${filename}`;
    if (localUrl !== url) {
      const res = await fetch(localUrl);
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    }
  }

  throw new Error(`Failed to fetch photo: ${url}`);
}

export async function fetchPhotoBuffer(
  token: string,
  ref: string,
): Promise<Buffer> {
  const resolved = resolveTelegramPhotoRef(ref);
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return fetchHttpPhoto(resolved);
  }

  const fileRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(resolved)}`,
  );
  const fileBody = (await fileRes.json()) as TgFileResponse;
  if (!fileBody.ok || !fileBody.result?.file_path) {
    throw new Error(fileBody.description ?? "Telegram getFile failed");
  }

  const imgRes = await fetch(
    `https://api.telegram.org/file/bot${token}/${fileBody.result.file_path}`,
  );
  if (!imgRes.ok) {
    throw new Error(`Failed to download Telegram file (${imgRes.status})`);
  }
  return Buffer.from(await imgRes.arrayBuffer());
}
