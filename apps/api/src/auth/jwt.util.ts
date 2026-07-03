import { createHmac, timingSafeEqual } from "node:crypto";

interface JwtPayload {
  sub: string;
  phone: string;
  iat: number;
  exp: number;
}

function b64url(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function parseB64url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

export function signToken(
  userId: string,
  phone: string,
  secret: string,
  ttlSec = 60 * 60 * 24 * 30,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({ sub: userId, phone, iat: now, exp: now + ttlSec }),
  );
  const sig = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(
  token: string,
  secret: string,
): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig!), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  const data = JSON.parse(parseB64url(payload!)) as JwtPayload;
  if (data.exp < Math.floor(Date.now() / 1000)) return null;
  return data;
}
