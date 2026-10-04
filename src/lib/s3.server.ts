// Server-only: imported by API routes, never by client components, so the AWS SDK and
// credentials stay out of the browser bundle. Credentials come from the AWS SDK's default
// provider chain (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars locally, or an IAM role).
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MAX_UPLOAD_BYTES, extensionOf, matchesSignature } from '@/lib/contact';

/** Contact attachments live under one private prefix; keys are generated here, never taken from filenames. */
const PREFIX = 'uploads/contact/';
const KEY_PATTERN = /^uploads\/contact\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|docx?|png|jpe?g|webp)$/;
/** Presigned upload URLs are short-lived; the browser uses them straight away. */
export const UPLOAD_URL_TTL = 300;
/** Download links in the enquiry email: 7 days, the longest S3 allows with access-key signing. */
export const DOWNLOAD_URL_TTL = 7 * 24 * 60 * 60;

let client: S3Client | null = null;

/**
 * The one shared S3 client, or null without AWS_REGION. Native AWS S3 needs no endpoint: the SDK
 * derives it from the region. AWS_S3_ENDPOINT is only for non-AWS S3-compatible stores (it also
 * switches to path-style addressing, which those stores expect).
 */
export function s3Client() {
  const region = process.env.AWS_REGION;
  if (!region) return null;
  const endpoint = process.env.AWS_S3_ENDPOINT || undefined;
  client ??= new S3Client({ region, ...(endpoint ? { endpoint, forcePathStyle: true } : {}) });
  return client;
}

/** The client and bucket for contact attachments, or null when not configured (the form then attaches by email). */
export function getS3() {
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const c = s3Client();
  if (!bucket || !c) return null;
  return { client: c, bucket };
}

/** The client, bucket and object key of the company dataset CSV, or null when it isn't configured. Separate from attachments. */
export function getCompaniesS3() {
  const bucket = process.env.AWS_S3_BUCKET;
  const key = process.env.AWS_S3_KEY;
  const c = s3Client();
  if (!bucket || !key || !c) return null;
  return { client: c, bucket, key };
}

export const newUploadKey = (filename: string) => `${PREFIX}${randomUUID()}${extensionOf(filename)}`;
export const isUploadKey = (key: string) => KEY_PATTERN.test(key);

/** A presigned PUT for exactly this key, content type and size, valid for UPLOAD_URL_TTL seconds. */
export async function presignUpload(key: string, contentType: string, size: number) {
  const s3 = getS3();
  if (!s3) throw new Error('S3 is not configured');
  const command = new PutObjectCommand({ Bucket: s3.bucket, Key: key, ContentType: contentType, ContentLength: size });
  return getSignedUrl(s3.client, command, { expiresIn: UPLOAD_URL_TTL, signableHeaders: new Set(['content-type', 'content-length']) });
}

/**
 * Re-checks an uploaded object before it's referenced anywhere: it must exist, be non-empty and
 * within the size limit, and its first bytes must match its extension. Returns its size, or null.
 */
export async function verifyUpload(key: string): Promise<number | null> {
  const s3 = getS3();
  if (!s3 || !isUploadKey(key)) return null;
  try {
    const head = await s3.client.send(new HeadObjectCommand({ Bucket: s3.bucket, Key: key }));
    const size = head.ContentLength ?? 0;
    if (size <= 0 || size > MAX_UPLOAD_BYTES) return null;
    const start = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: key, Range: 'bytes=0-15' }));
    const bytes = await start.Body?.transformToByteArray();
    return bytes && matchesSignature(key, bytes) ? size : null;
  } catch (err) {
    console.error('[s3] Could not verify upload:', (err as Error).name);
    return null;
  }
}

/** A temporary download link that saves the file under its original (sanitised) name. */
export async function presignDownload(key: string, filename: string) {
  const s3 = getS3();
  if (!s3) throw new Error('S3 is not configured');
  const command = new GetObjectCommand({
    Bucket: s3.bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, '')}"`,
  });
  return getSignedUrl(s3.client, command, { expiresIn: DOWNLOAD_URL_TTL });
}

/** Removes an upload that failed verification. Only keys this app generates can be deleted. */
export async function deleteUpload(key: string) {
  const s3 = getS3();
  if (!s3 || !isUploadKey(key)) return;
  try {
    await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
  } catch (err) {
    console.error('[s3] Could not delete rejected upload:', (err as Error).name);
  }
}
