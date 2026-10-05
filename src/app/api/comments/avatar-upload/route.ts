import { presignAvatarUpload, avatarsEnabled } from '@/lib/avatar-store.server';
import { validateAvatar } from '@/lib/comments';
import { clientIp } from '@/lib/request.server';

/**
 * Issues a short-lived presigned URL so the browser can upload a comment avatar straight to the private S3
 * bucket. /api/comments re-verifies the stored object (size, type, magic bytes) before linking it.
 *
 * POST { filename: string, size: number } → { key, uploadUrl, contentType, expiresIn }
 */

// Soft per-instance rate limit, as for /api/upload.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  if (hits.size > 500) hits.forEach((times, key) => { if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key); });
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const json = (body: unknown, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  if (!avatarsEnabled()) return json({ error: 'unavailable' }, 503);
  if (rateLimited(clientIp(request))) return json({ error: 'rate_limited' }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request' }, 400);
  }
  const { filename, size } = (body ?? {}) as { filename?: unknown; size?: unknown };
  if (typeof filename !== 'string' || typeof size !== 'number' || !Number.isInteger(size) || filename.length > 255) {
    return json({ error: 'invalid_request' }, 400);
  }
  const problem = validateAvatar({ name: filename, size });
  if (problem) return json({ errors: { avatar: problem } }, 400);
  try {
    return json(await presignAvatarUpload(filename, size), 200);
  } catch (err) {
    console.error('[avatar-upload] Could not create upload URL:', (err as Error).name);
    return json({ error: 'upload_failed' }, 502);
  }
}
