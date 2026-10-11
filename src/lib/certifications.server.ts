import 'server-only';

import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { unstable_cache } from 'next/cache';
import { listAllCertificateObjects, mapCertificateObject } from '@/lib/certifications';
import { s3Client } from '@/lib/s3.server';
import localManifest from '@/data/certifications.generated.json';
import type { Certification } from '@/types';

type LocalCertificate = { id: string; name: string; objectKey: string; url: string; issuer?: string; technology?: string; category?: string; level?: string; issuedAt?: string };

/** Certificates imported from `.certification` by scripts/import-certifications.mts; no S3 needed. */
function localCertifications(): Certification[] {
  const seen = new Set<string>();
  return (localManifest as LocalCertificate[])
    .filter((item) => item.id && item.url && !seen.has(item.id) && seen.add(item.id))
    .toSorted((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? '') || a.name.localeCompare(b.name))
    .map((item, index) => ({ ...item, number: String(index + 1).padStart(2, '0'), fileType: 'image' as const }));
}

const PRESIGNED_URL_TTL_SECONDS = 60 * 60;
const CACHE_SECONDS = 10 * 60;

async function discoverCertifications(): Promise<Certification[]> {
  const bucket = process.env.CERTIFICATIONS_S3_BUCKET;
  if (!bucket) throw new Error('Certification storage is not configured');
  const client = s3Client();
  if (!client) throw new Error('S3 region not configured');

  const objects = await listAllCertificateObjects((command) => client.send(command), bucket);
  const ordered = objects.toSorted((a, b) => {
    const dateDifference = (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0);
    return dateDifference || (a.Key ?? '').localeCompare(b.Key ?? '');
  });

  return Promise.all(ordered.map(async (object, index) => {
    const key = object.Key as string;
    let metadata: Record<string, string | undefined> = {};
    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      metadata = head.Metadata ?? {};
    } catch (error) {
      console.warn('[certifications] Metadata unavailable for object:', key, (error as Error).name);
    }
    const signedUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: PRESIGNED_URL_TTL_SECONDS });
    return mapCertificateObject(object, metadata, signedUrl, index);
  }));
}

const getCachedCertifications = unstable_cache(discoverCertifications, ['s3-certifications-v1'], {
  revalidate: CACHE_SECONDS,
  tags: ['certifications'],
});

export async function getCertifications(): Promise<{ certifications: Certification[]; error?: string }> {
  const local = localCertifications();
  if (local.length) return { certifications: local };
  try {
    return { certifications: await getCachedCertifications() };
  } catch (error) {
    const errorName = (error as Error).name;
    const errorMessage = (error as Error).message;
    // Suppress error logs for expected misconfigurations (local dev, missing credentials)
    const isConfigError = errorMessage.includes('not configured');
    const isCredentialError = errorName === 'InvalidAccessKeyId' || errorName === 'NoCredentialProvider';

    if (!isConfigError && !isCredentialError) {
      console.error('[certifications] Could not load from S3:', errorName);
    }
    return { certifications: [], error: 'Certificates are temporarily unavailable.' };
  }
}
