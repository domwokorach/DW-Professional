const WINDOW_MS = 5 * 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = 30;

const requestLog = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter(
    (ts) => now - ts < WINDOW_MS
  );

  if (timestamps.length >= MAX_MESSAGES_PER_WINDOW) {
    requestLog.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return false;
}
