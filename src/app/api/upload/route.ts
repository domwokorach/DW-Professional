import { CONTENT_TYPES, extensionOf, validateFile } from '@/lib/contact';
import { getS3, newUploadKey, presignUpload, UPLOAD_URL_TTL } from '@/lib/s3.server';

/**
 * Issues a short-lived presigned URL so the browser can upload a contact attachment straight to
 * the private S3 bucket. The file itself never passes through this server; /api/contact
 * re-verifies the stored object before using it.
 *
 * POST { filename: string, size: number } → { key, uploadUrl, contentType, expiresIn }
 */

// Soft per-instance rate limit, as for /api/contact.
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

const json = (body: unknown, status: number) => Response.json(body, { status });

export async function POST(request: Request) {
  if (!getS3()) return json({ error: 'unavailable' }, 503);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429);

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

  const fileError = validateFile({ name: filename, size });
  if (fileError) return json({ errors: { file: fileError } }, 400);

  const contentType = CONTENT_TYPES[extensionOf(filename) as keyof typeof CONTENT_TYPES];
  const key = newUploadKey(filename);
  try {
    const uploadUrl = await presignUpload(key, contentType, size);
    return json({ key, uploadUrl, contentType, expiresIn: UPLOAD_URL_TTL }, 200);
  } catch (err) {
    console.error('[upload] Could not create upload URL:', (err as Error).name);
    return json({ error: 'upload_failed' }, 502);
  }
}
