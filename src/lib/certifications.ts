import { createHash } from 'node:crypto';
import { ListObjectsV2Command, type _Object as S3Object } from '@aws-sdk/client-s3';
import type { Certification } from '@/types';

const SUPPORTED_EXTENSION = /\.(pdf|png|jpe?g|webp)$/i;

export type CertificateObjectMetadata = Record<string, string | undefined>;
export type CertificateListSender = (command: ListObjectsV2Command) => Promise<{ Contents?: S3Object[]; IsTruncated?: boolean; NextContinuationToken?: string }>;

export function isSupportedCertificateKey(key: string | undefined): key is string {
  return Boolean(key && SUPPORTED_EXTENSION.test(key) && !key.endsWith('/'));
}

export function dedupeCertificateObjects(objects: S3Object[]) {
  const seen = new Set<string>();
  return objects.filter((object) => {
    if (!isSupportedCertificateKey(object.Key) || seen.has(object.Key)) return false;
    seen.add(object.Key);
    return true;
  });
}

export async function listAllCertificateObjects(send: CertificateListSender, bucket: string) {
  const objects: S3Object[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }));
    objects.push(...(page.Contents ?? []));
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return dedupeCertificateObjects(objects);
}

export function certificateTitleFromKey(key: string) {
  const filename = key.split('/').at(-1)?.replace(SUPPORTED_EXTENSION, '') ?? key;
  const cleaned = filename.replace(/\+/g, ' ').replace(/[_-]+/g, ' ').replace(/\bcertificate\b/gi, '').replace(/\s+/g, ' ').trim();
  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Untitled certificate';
}

function clean(value: string | undefined) {
  const result = value?.trim();
  return result || undefined;
}

function httpsUrl(value: string | undefined) {
  const candidate = clean(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function issueDate(value: string | undefined) {
  const candidate = clean(value);
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
}

export function mapCertificateObject(
  object: S3Object,
  metadata: CertificateObjectMetadata,
  signedUrl: string,
  index: number,
): Certification {
  const key = object.Key as string;
  const extension = key.split('.').at(-1)?.toLowerCase();
  return {
    id: createHash('sha256').update(key).digest('hex').slice(0, 16),
    number: String(index + 1).padStart(2, '0'),
    name: clean(metadata.title) ?? certificateTitleFromKey(key),
    objectKey: key,
    fileType: extension === 'pdf' ? 'pdf' : 'image',
    issuer: clean(metadata.issuer),
    technology: clean(metadata.technology),
    category: clean(metadata.category),
    level: clean(metadata.level),
    issuedAt: issueDate(metadata['issued-at'] ?? metadata.issuedat),
    url: signedUrl,
    credentialUrl: httpsUrl(metadata['credential-url'] ?? metadata.credentialurl),
  };
}
