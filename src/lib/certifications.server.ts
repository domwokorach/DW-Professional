import 'server-only';

import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { unstable_cache } from 'next/cache';
import { listAllCertificateObjects, mapCertificateObject } from '@/lib/certifications';
import { s3Client } from '@/lib/s3.server';
import type { Certification } from '@/types';

const PRESIGNED_URL_TTL_SECONDS = 60 * 60;
const CACHE_SECONDS = 10 * 60;

async function discoverCertifications(): Promise<Certification[]> {
  const bucket = process.env.CERTIFICATIONS_S3_BUCKET;
  const client = s3Client();
  if (!bucket || !client) throw new Error('Certification storage is not configured');

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
  try {
    return { certifications: await getCachedCertifications() };
  } catch (error) {
    console.error('[certifications] Could not load from S3:', (error as Error).name);
    return { certifications: [], error: 'Certificates are temporarily unavailable.' };
  }
}
