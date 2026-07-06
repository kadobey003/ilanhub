import { and, eq } from "drizzle-orm";
import { channelConfigs, type Database } from "@ilanhub/database";
import { resolvePublicBaseUrl } from "@ilanhub/shared";

export async function resolveProjectPublicUrl(
  db: Database,
  projectId: string,
): Promise<string> {
  const [row] = await db
    .select({ config: channelConfigs.config })
    .from(channelConfigs)
    .where(
      and(
        eq(channelConfigs.projectId, projectId),
        eq(channelConfigs.channel, "telegram"),
        eq(channelConfigs.purpose, "listing_input"),
      ),
    )
    .limit(1);

  const cfg = (row?.config ?? {}) as Record<string, unknown>;
  const menu = (cfg.menu ?? {}) as Record<string, unknown>;
  return resolvePublicBaseUrl(String(menu.siteUrl ?? ""));
}
