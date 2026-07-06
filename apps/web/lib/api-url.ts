/** Server-side API base (SSR / RSC). */
export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3010";

/** Client-side API base — same origin via nginx /api when empty. */
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined"
    ? (process.env.API_URL ?? "http://localhost:3010")
    : "");
