import { createTelegramPublisher } from "./telegram.js";
import { viberPublisher } from "./viber.js";
import { whatsappPublisher } from "./whatsapp.js";
import { instagramPublisher } from "./instagram.js";
import { webPublisher } from "./web.js";
import type { Publisher } from "./types.js";
import type { Database } from "@ilanhub/database";

export function createPublishers(db: Database): Record<string, Publisher> {
  return {
    telegram: createTelegramPublisher(db),
    viber: viberPublisher,
    whatsapp: whatsappPublisher,
    instagram: instagramPublisher,
    web: webPublisher,
  };
}

export * from "./types.js";
