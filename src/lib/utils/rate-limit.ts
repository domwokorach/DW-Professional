import { RATE_LIMIT_MAX_MESSAGES, RATE_LIMIT_WINDOW_MS } from "@/config/chat";

const requestLog = new Map<string, number[]>();

/** In-memory sliding-window limiter. The socket server is a single long-running process, so no shared store is needed. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    requestLog.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}
