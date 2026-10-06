// Soft per-instance rate limit for public API routes (instances are reused under Fluid Compute, so
// this stops bursts from one address; it is not a global guarantee).

export function createRateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();
  return function limited(key: string) {
    const now = Date.now();
    // Drop stale entries now and then so the table can't grow without bound.
    if (hits.size > 500) hits.forEach((times, k) => { if (times.every((t) => now - t >= windowMs)) hits.delete(k); });
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    return recent.length > max;
  };
}

export const clientIp = (request: Request) => request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
