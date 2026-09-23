import { signRelay } from "@/lib/socket/relay";
import { getRedisClient } from "./client";

/**
 * Cross-instance pub/sub for presence/typing broadcasts. Only needed once
 * the socket server runs as more than one instance; single-instance
 * deployments rely on Socket.IO's in-process room broadcast instead, so
 * this is a no-op when REDIS_URL isn't configured.
 */
export async function publish(channel: string, message: unknown): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try { await redis.publish(channel, JSON.stringify(message)); return; }
    catch (error) { console.error("[chat] Redis publication failed; trying socket relay", error); }
  }
  const baseUrl = process.env.SOCKET_SERVER_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
  const secret = process.env.SOCKET_SECRET;
  if (!baseUrl || !secret) throw new Error("Chat event relay is not configured");
  const body = JSON.stringify({ channel, payload: message });
  const timestamp = String(Date.now());
  const response = await fetch(new URL("/internal/chat/events", baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Chat-Timestamp": timestamp, "X-Chat-Signature": signRelay(body, timestamp, secret) },
    body,
    signal: AbortSignal.timeout(5000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Chat relay failed (${response.status})`);
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
