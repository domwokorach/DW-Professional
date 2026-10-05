// Server-only: comment avatars in the private S3 bucket (the same bucket as contact attachments, under their
// own prefix). The browser uploads with a short-lived presigned PUT; the image is only ever served back through
// /api/comments/[id]/avatar, which checks the comment is approved (or the viewer is an admin).
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AVATAR_MAX_BYTES, AVATAR_TYPES, avatarExtension } from '@/lib/comments';
import { matchesSignature } from '@/lib/contact';
import { getS3, UPLOAD_URL_TTL } from '@/lib/s3.server';

const PREFIX = 'uploads/avatars/';
const KEY_PATTERN = /^uploads\/avatars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp)$/;

export const avatarsEnabled = () => getS3() !== null;
export const isAvatarKey = (key: string) => KEY_PATTERN.test(key);
const contentTypeOf = (key: string) => AVATAR_TYPES[avatarExtension(key) as keyof typeof AVATAR_TYPES];

/** A new key and a presigned PUT for exactly that key, content type and size. */
export async function presignAvatarUpload(filename: string, size: number) {
  const s3 = getS3();
  if (!s3) throw new Error('S3 is not configured');
  const key = `${PREFIX}${randomUUID()}${avatarExtension(filename)}`;
  const contentType = contentTypeOf(key);
  const command = new PutObjectCommand({ Bucket: s3.bucket, Key: key, ContentType: contentType, ContentLength: size });
  const uploadUrl = await getSignedUrl(s3.client, command, {
    expiresIn: UPLOAD_URL_TTL,
    signableHeaders: new Set(['content-type', 'content-length']),
  });
  return { key, uploadUrl, contentType, expiresIn: UPLOAD_URL_TTL };
}

export type AvatarCheck = 'ok' | 'too_large' | 'invalid';

/** What `sharp` calls each format we accept, by extension. */
const SHARP_FORMAT: Record<string, string> = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp' };
/** Decode limit: stops a small file that expands into a huge bitmap. */
const MAX_PIXELS = 40_000_000;

/**
 * Checks the stored object, never trusting the filename or the browser's content type: it must exist, be within
 * the size limit, start with the signature of its extension, AND actually decode as that image format (so a
 * truncated, corrupt or disguised file is refused).
 */
export async function checkAvatar(key: string): Promise<AvatarCheck> {
  const s3 = getS3();
  if (!s3 || !isAvatarKey(key)) return 'invalid';
  try {
    const head = await s3.client.send(new HeadObjectCommand({ Bucket: s3.bucket, Key: key }));
    const size = head.ContentLength ?? 0;
    if (size > AVATAR_MAX_BYTES) return 'too_large';
    if (size <= 0) return 'invalid';
    const obj = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes || bytes.length > AVATAR_MAX_BYTES) return bytes ? 'too_large' : 'invalid';
    if (!matchesSignature(key, bytes)) return 'invalid';

    let sharp: (typeof import('sharp'))['default'] | null = null;
    try {
      sharp = (await import('sharp')).default;
    } catch {
      console.error('[avatar] sharp is unavailable: relying on the signature check only');
    }
    if (sharp) {
      try {
        const image = sharp(Buffer.from(bytes), { limitInputPixels: MAX_PIXELS, failOn: 'error' });
        const meta = await image.metadata();
        if (meta.format !== SHARP_FORMAT[avatarExtension(key)] || !meta.width || !meta.height) return 'invalid';
        await image.resize(16, 16, { fit: 'inside' }).toBuffer(); // a real decode: corrupt data throws here
      } catch {
        return 'invalid';
      }
    }
    return 'ok';
  } catch (err) {
    console.error('[avatar] Could not verify upload:', (err as Error).name);
    return 'invalid';
  }
}

/** Kept for callers that only need a yes/no. */
export const verifyAvatar = async (key: string) => (await checkAvatar(key)) === 'ok';

/** The image bytes as a stream with its content type, or null. */
export async function readAvatar(key: string) {
  const s3 = getS3();
  if (!s3 || !isAvatarKey(key)) return null;
  try {
    const obj = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    if (!obj.Body) return null;
    return { body: obj.Body.transformToWebStream(), contentType: contentTypeOf(key), size: obj.ContentLength };
  } catch (err) {
    console.error('[avatar] Could not read avatar:', (err as Error).name);
    return null;
  }
}

export async function deleteAvatar(key: string) {
  const s3 = getS3();
  if (!s3 || !isAvatarKey(key)) return;
  try {
    await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
  } catch (err) {
    console.error('[avatar] Could not delete avatar:', (err as Error).name);
  }
}
