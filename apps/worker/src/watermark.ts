import { applyHorecaWatermark, isWatermarkEnabled } from "@ilanhub/watermark";
import { fetchPhotoBuffer } from "./photo-source.js";

export {
  applyHorecaWatermark,
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
