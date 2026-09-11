import { getRedisClient } from "./client";

const PRESENCE_KEY_PREFIX = "presence:admin:";
const VISITOR_PRESENCE_KEY_PREFIX = "presence:visitor:";
const PRESENCE_TTL_SECONDS = 60;

/** In-memory fallback used when REDIS_URL isn't set — fine for the single-process socket server. */
const memoryPresence = new Map<string, number>();
const memoryVisitorPresence = new Map<string, number>();

export async function setAdminOnline(adminId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryPresence.set(adminId, Date.now());
    return;
  }
  await redis.set(`${PRESENCE_KEY_PREFIX}${adminId}`, "1", "EX", PRESENCE_TTL_SECONDS);
}

export async function setAdminOffline(adminId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryPresence.delete(adminId);
    return;
  }
  await redis.del(`${PRESENCE_KEY_PREFIX}${adminId}`);
}

export async function isAnyAdminOnline(): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return memoryPresence.size > 0;
  const keys = await redis.keys(`${PRESENCE_KEY_PREFIX}*`);
  return keys.length > 0;
}

export async function getOnlineAdminIds(): Promise<string[]> {
  const redis = getRedisClient();
  if (!redis) return Array.from(memoryPresence.keys());
  const keys = await redis.keys(`${PRESENCE_KEY_PREFIX}*`);
  return keys.map((key) => key.slice(PRESENCE_KEY_PREFIX.length));
}

export async function setVisitorOnline(visitorId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryVisitorPresence.set(visitorId, Date.now());
    return;
  }
  await redis.set(`${VISITOR_PRESENCE_KEY_PREFIX}${visitorId}`, "1", "EX", PRESENCE_TTL_SECONDS);
}

export async function setVisitorOffline(visitorId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryVisitorPresence.delete(visitorId);
    return;
  }
  await redis.del(`${VISITOR_PRESENCE_KEY_PREFIX}${visitorId}`);
}

export async function isVisitorOnline(visitorId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return memoryVisitorPresence.has(visitorId);
  const value = await redis.get(`${VISITOR_PRESENCE_KEY_PREFIX}${visitorId}`);
  return value !== null;
}
