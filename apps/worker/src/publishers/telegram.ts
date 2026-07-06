import { and, eq } from "drizzle-orm";
import { channelConfigs, type Database } from "@ilanhub/database";
import { formatTelegramListing } from "../format-listing.js";
import { prepareHorecaPhoto, prepareAutoPhoto } from "../watermark.js";
import { fetchPhotoBuffer } from "../photo-source.js";
import {
  telegramSendMediaGroup,
  telegramSendMediaGroupBuffers,
  telegramSendMessage,
  telegramSendPhoto,
  telegramSendPhotoBuffer,
} from "../telegram-api.js";
import type { Publisher, PublishResult } from "./types.js";

async function sendSinglePhoto(opts: {
  token: string;
  chatId: string;
  caption: string;
  ref: string;
  projectSlug: string;
  watermarkTitle: string;
  errors: string[];
}): Promise<number> {
  const { token, chatId, caption, ref, projectSlug, watermarkTitle, errors } =
    opts;
  const useWatermark = projectSlug === "horeca" || projectSlug === "auto";

  if (useWatermark) {
    try {
      const watermarked =
        projectSlug === "auto"
          ? await prepareAutoPhoto(token, ref, watermarkTitle)
          : await prepareHorecaPhoto(token, ref, watermarkTitle);
      return await telegramSendPhotoBuffer(token, chatId, watermarked, caption);
    } catch (err) {
      errors.push(`watermark: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const raw = await fetchPhotoBuffer(token, ref);
      return await telegramSendPhotoBuffer(token, chatId, raw, caption);
    } catch (err) {
      errors.push(`buffer: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    return await telegramSendPhoto(token, chatId, ref, caption);
  } catch (err) {
    errors.push(`photo: ${err instanceof Error ? err.message : String(err)}`);
    throw new Error(errors.join("; "));
  }
}

async function sendWatermarkedAlbum(opts: {
  token: string;
  chatId: string;
  photos: string[];
  caption: string;
  projectSlug: string;
  watermarkTitle: string;
}): Promise<number> {
  const { token, chatId, photos, caption, projectSlug, watermarkTitle } = opts;
  const prepare =
    projectSlug === "auto" ? prepareAutoPhoto : prepareHorecaPhoto;
  const chunks: string[][] = [];
  for (let i = 0; i < photos.length; i += 10) {
    chunks.push(photos.slice(i, i + 10));
  }

  let firstMessageId = 0;
  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c]!;
    const buffers: Buffer[] = [];
    for (const ref of chunk) {
      buffers.push(await prepare(token, ref, watermarkTitle));
    }
    const ids = await telegramSendMediaGroupBuffers(
      token,
      chatId,
      buffers,
      c === 0 ? caption : undefined,
    );
    if (!firstMessageId) firstMessageId = ids[0] ?? 0;
  }
  return firstMessageId;
}

async function resolveBotToken(
  db: Database,
  projectId: string,
): Promise<string> {
  const rows = await db
    .select()
    .from(channelConfigs)
    .where(
      and(
        eq(channelConfigs.projectId, projectId),
        eq(channelConfigs.channel, "telegram"),
        eq(channelConfigs.purpose, "listing_input"),
      ),
    );

  const row =
    rows.find((r) => r.isActive) ??
    rows.find((r) => Boolean((r.config as Record<string, unknown>).botToken));

  const fromDb = row
    ? String((row.config as Record<string, unknown>).botToken ?? "")
    : "";
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const token = fromDb || fromEnv;
  if (!token) {
    throw new Error("Telegram bot token not configured");
  }
  return token;
}

export function createTelegramPublisher(db: Database): Publisher {
  return {
    async publish(ctx, channelConfig): Promise<PublishResult> {
      const config = channelConfig.config as Record<string, unknown>;
      const chatId = String(config.channelId ?? config.chatId ?? "");
      if (!chatId || chatId === "stub") {
        throw new Error("Telegram channelId not configured");
      }

      const token = await resolveBotToken(db, ctx.listing.projectId);
      const caption = formatTelegramListing(ctx);
      const photos = ctx.media
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m) => m.url)
        .filter(Boolean);
      const projectSlug = ctx.project.slug;
      const useWatermark = projectSlug === "horeca" || projectSlug === "auto";
      const watermarkTitle =
        ctx.listing.title?.trim() ||
        ctx.listing.businessType?.trim() ||
        (projectSlug === "auto" ? "Авто" : "Horeca");

      let messageId: number;

      if (!photos.length) {
        messageId = await telegramSendMessage(token, chatId, caption);
        return { externalId: `tg:${chatId}:${messageId}` };
      }

      const photoErrors: string[] = [];

      if (photos.length === 1) {
        messageId = await sendSinglePhoto({
          token,
          chatId,
          caption,
          ref: photos[0]!,
          projectSlug,
          watermarkTitle,
          errors: photoErrors,
        });
      } else if (useWatermark && projectSlug === "auto") {
        messageId = await sendWatermarkedAlbum({
          token,
          chatId,
          photos,
          caption,
          projectSlug,
          watermarkTitle,
        });
      } else if (useWatermark) {
        try {
          const watermarked = await prepareHorecaPhoto(
            token,
            photos[0]!,
            watermarkTitle,
          );
          messageId = await telegramSendPhotoBuffer(
            token,
            chatId,
            watermarked,
            caption,
          );
        } catch (err) {
          photoErrors.push(err instanceof Error ? err.message : String(err));
          const ids = await telegramSendMediaGroup(
            token,
            chatId,
            photos.slice(0, 10),
            caption,
          );
          messageId = ids[0] ?? 0;
        }
      } else {
        const ids = await telegramSendMediaGroup(
          token,
          chatId,
          photos.slice(0, 10),
          caption,
        );
        messageId = ids[0] ?? 0;
        if (photos.length > 10) {
          await telegramSendMediaGroup(token, chatId, photos.slice(10, 20));
        }
      }

      if (!messageId) {
        throw new Error(
          photoErrors.length
            ? `Telegram photo publish failed: ${photoErrors.join("; ")}`
            : "Telegram photo publish failed",
        );
      }

      return { externalId: `tg:${chatId}:${messageId}` };
    },
  };
}
