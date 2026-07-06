import {
  applyAutoWatermark,
  applyHorecaWatermark,
  isAutoWatermarkEnabled,
  isWatermarkEnabled,
} from "@ilanhub/watermark";
import { fetchPhotoBuffer } from "./photo-source.js";

export {
  applyAutoWatermark,
  applyHorecaWatermark,
  isAutoWatermarkEnabled,
  isWatermarkEnabled,
  resolveWatermarkLogoPath,
} from "@ilanhub/watermark";
export type { WatermarkOptions } from "@ilanhub/watermark";

export async function prepareHorecaPhoto(
  token: string,
  ref: string,
  title?: string | null,
): Promise<Buffer> {
  const raw = await fetchPhotoBuffer(token, ref);
  if (!isWatermarkEnabled()) return raw;
  if (ref.startsWith("http://") || ref.startsWith("https://")) return raw;
  return applyHorecaWatermark(raw, { title });
}

export async function prepareAutoPhoto(
  token: string,
  ref: string,
  title?: string | null,
): Promise<Buffer> {
  const raw = await fetchPhotoBuffer(token, ref);
  if (!isAutoWatermarkEnabled()) return raw;
  return applyAutoWatermark(raw, { title });
}

export async function prepareProjectPhoto(
  projectSlug: string,
  token: string,
  ref: string,
  title?: string | null,
): Promise<Buffer> {
  if (projectSlug === "auto") {
    return prepareAutoPhoto(token, ref, title);
  }
  return prepareHorecaPhoto(token, ref, title);
}
