import { getRedisClient } from "./client";

const PRESENCE_KEY_PREFIX = "presence:admin:";
const PRESENCE_TTL_SECONDS = 60;

/** In-memory fallback used when REDIS_URL isn't set — fine for the single-process socket server. */
const memoryPresence = new Map<string, number>();

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
