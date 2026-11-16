// Browser stand-in for lib/certifications.server: the certificates imported from .certification (same list the site falls back to).
import localManifest from '@/data/certifications.generated.json';
import type { Certification } from '@/types';

type LocalCertificate = { id: string; name: string; objectKey: string; url: string; issuer?: string; technology?: string; category?: string; level?: string; issuedAt?: string };

export async function getCertifications(): Promise<{ certifications: Certification[]; error?: string }> {
  const seen = new Set<string>();
  const certifications = (localManifest as LocalCertificate[])
    .filter((item) => item.id && item.url && !seen.has(item.id) && seen.add(item.id))
    .sort((a, b) => (b.issuedAt ?? '').localeCompare(a.issuedAt ?? '') || a.name.localeCompare(b.name))
    .map((item, index) => ({ ...item, number: String(index + 1).padStart(2, '0'), fileType: 'image' as const }));
  return { certifications };
}
