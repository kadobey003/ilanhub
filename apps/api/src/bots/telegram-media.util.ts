import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { applyAutoWatermark, applyHorecaWatermark, isAutoWatermarkEnabled, isWatermarkEnabled } from "@ilanhub/watermark";
type TgFileResponse = {
  ok: boolean;
  result?: { file_path?: string };
  description?: string;
};

function uploadsDir(): string {
  return process.env.UPLOADS_DIR ?? join(process.cwd(), "uploads", "listings");
}

function publicBaseUrl(): string {
  const base = process.env.PUBLIC_URL ?? "http://localhost:3010";
  return `${base.replace(/\/$/, "")}/api/uploads/listings`;
}

export async function mirrorTelegramMedia(
  token: string,
  ref: string,
  opts?: { title?: string | null; watermark?: "horeca" | "auto" | "off" },
): Promise<string | null> {  if (!ref.startsWith("tg:")) return ref;

  const fileId = ref.slice(3);
  const fileRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );
  const fileBody = (await fileRes.json()) as TgFileResponse;
  if (!fileBody.ok || !fileBody.result?.file_path) {
    console.warn(
      "mirrorTelegramMedia getFile failed:",
      fileBody.description ?? fileId,
    );
    return null;
  }

  const imgRes = await fetch(
    `https://api.telegram.org/file/bot${token}/${fileBody.result.file_path}`,
  );
  if (!imgRes.ok) return null;

  let buffer: Buffer = Buffer.from(await imgRes.arrayBuffer());
  const wm = opts?.watermark ?? "horeca";
  if (wm === "horeca" && isWatermarkEnabled()) {
    buffer = Buffer.from(await applyHorecaWatermark(buffer, { title: opts?.title }));
  } else if (wm === "auto" && isAutoWatermarkEnabled()) {
    buffer = Buffer.from(await applyAutoWatermark(buffer, { title: opts?.title }));
  }

  const name = `${randomUUID()}.jpg`;  const dir = uploadsDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buffer);
  return `${publicBaseUrl()}/${name}`;
}

export async function mirrorTelegramMediaList(
  token: string,
  refs: string[],
  opts?: { title?: string | null; watermark?: "horeca" | "auto" | "off" },
): Promise<string[]> {
  const out: string[] = [];
  for (const ref of refs) {
    const mirrored = await mirrorTelegramMedia(token, ref, opts);
    out.push(mirrored ?? ref);
  }
  return out;
}