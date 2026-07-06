import type { MetadataRoute } from "next";
import { BRAND_NAME, BRAND_LOGO_PATH } from "@ilanhub/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME} — Оголошення в Україні`,
    short_name: BRAND_NAME,
    description:
      "Робота, Horeca, авто — подайте оголошення через Telegram, Viber, WhatsApp або сайт.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f1f5f9",
    theme_color: "#2563eb",
    categories: ["business", "lifestyle"],
    icons: [
      { src: BRAND_LOGO_PATH, sizes: "192x192", type: "image/png" },
      { src: BRAND_LOGO_PATH, sizes: "512x512", type: "image/png" },
      {
        src: BRAND_LOGO_PATH,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
