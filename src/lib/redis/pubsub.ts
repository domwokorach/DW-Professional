import { getRedisClient } from "./client";

/**
 * Cross-instance pub/sub for presence/typing broadcasts. Only needed once
 * the socket server runs as more than one instance; single-instance
 * deployments rely on Socket.IO's in-process room broadcast instead, so
 * this is a no-op when REDIS_URL isn't configured.
 */
export async function publish(channel: string, message: unknown): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.publish(channel, JSON.stringify(message));
}

export function subscribe(channel: string, onMessage: (payload: unknown) => void): () => void {
  const redis = getRedisClient();
  if (!redis) return () => {};

  const subscriber = redis.duplicate();
  subscriber.subscribe(channel);
  subscriber.on("message", (_ch, raw) => {
    try {
      onMessage(JSON.parse(raw));
    } catch {
      // ignore malformed payloads
    }
  });

  return () => {
    subscriber.unsubscribe(channel);
    subscriber.disconnect();
  };
}
