import { Inject, Injectable, BadRequestException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@ilanhub/shared";
import { siteBranding, type Database } from "@ilanhub/database";
import { DRIZZLE } from "../common/constants.js";
import { saveBrandingLogo } from "../branding/branding-upload.util.js";

@Injectable()
export class SiteService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getBranding() {
    const [row] = await this.db
      .select()
      .from(siteBranding)
      .where(eq(siteBranding.id, 1))
      .limit(1);

    return {
      brandName: row?.brandName ?? BRAND_NAME,
      logoUrl: row?.logoUrl ?? BRAND_LOGO_PATH,
    };
  }

  async getBrandingResponse() {
    return { data: await this.getBranding() };
  }

  async updateBranding(brandName: string) {
    const name = brandName.trim();
    await this.db
      .insert(siteBranding)
      .values({ id: 1, brandName: name })
      .onConflictDoUpdate({
        target: siteBranding.id,
        set: { brandName: name, updatedAt: new Date() },
      });
    return this.getBrandingResponse();
  }

  async uploadLogo(dataUrl: string) {
    let logoUrl: string;
    try {
      logoUrl = await saveBrandingLogo(dataUrl);
    } catch (e) {
      throw new BadRequestException(
        e instanceof Error ? e.message : "Logo upload failed",
      );
    }
    const [row] = await this.db
      .select({ brandName: siteBranding.brandName })
      .from(siteBranding)
      .where(eq(siteBranding.id, 1))
      .limit(1);

    await this.db
      .insert(siteBranding)
      .values({ id: 1, brandName: row?.brandName ?? BRAND_NAME, logoUrl })
      .onConflictDoUpdate({
        target: siteBranding.id,
        set: { logoUrl, updatedAt: new Date() },
      });

    return this.getBrandingResponse();
  }
}
