import { Redis } from "ioredis";
import { type BotSession, type Channel, ListingState } from "@ilanhub/shared";

const TTL_SECONDS = 24 * 60 * 60;

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  }
  return redis;
}

function sessionKey(channel: Channel, userId: string): string {
  return `session:${channel}:${userId}`;
}

export async function getSession(
  channel: Channel,
  userId: string,
): Promise<BotSession | null> {
  const raw = await getRedis().get(sessionKey(channel, userId));
  if (!raw) return null;
  return JSON.parse(raw) as BotSession;
}

export async function saveSession(session: BotSession): Promise<void> {
  session.updatedAt = new Date().toISOString();
  await getRedis().set(
    sessionKey(session.channel, session.userId),
    JSON.stringify(session),
    "EX",
    TTL_SECONDS,
  );
}

export async function clearSession(
  channel: Channel,
  userId: string,
): Promise<void> {
  await getRedis().del(sessionKey(channel, userId));
}

export function createSession(userId: string, channel: Channel): BotSession {
  return {
    userId,
    channel,
    state: ListingState.SELECT_PROJECT,
    updatedAt: new Date().toISOString(),
  };
}
