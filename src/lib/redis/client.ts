import Redis from "ioredis";

let client: Redis | null = null;
let attempted = false;

/**
 * Returns a shared ioredis client, or null when REDIS_URL isn't configured.
 * Callers (lib/redis/presence.ts, lib/redis/pubsub.ts) fall back to
 * in-memory state when this is null, so Redis stays optional in dev and
 * single-instance deployments.
 */
export function getRedisClient(): Redis | null {
  if (attempted) return client;
  attempted = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
  client.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });
  return client;
}
