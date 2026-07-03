import { Inject, Injectable } from "@nestjs/common";
import { listingMedia, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import type { UploadMediaDto } from "./dto/media.dto.js";

@Injectable()
export class MediaService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async upload(dto: UploadMediaDto) {
    const endpoint = process.env.MINIO_ENDPOINT ?? "localhost:9000";
    const bucket = "ilanhub";
    const key = `listings/${dto.listingId}/${dto.filename}`;
    const url = `http://${endpoint}/${bucket}/${key}`;

    const [row] = await this.db
      .insert(listingMedia)
      .values({
        listingId: dto.listingId,
        url,
        mimeType: dto.mimeType,
      })
      .returning();

    return {
      media: row,
      uploadUrl: url,
      stub: true,
      message: "MinIO upload stub — presigned URL not implemented",
    };
  }
}
