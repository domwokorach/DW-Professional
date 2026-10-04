// Server-only persistence for contact enquiries. Storage is best-effort: if the database is
// unavailable the enquiry is still emailed, and the error is only logged.
import type { ContactFields } from '@/lib/contact';
import { getPrisma } from '@/lib/prisma.server';

export type StoredEnquiry = { id: string; emailStatus: 'PENDING' | 'SENT' | 'FAILED' };
export type MediaMeta = { key: string; filename: string; mimeType: string; size: number };

const logError = (what: string, err: unknown) =>
  console.error(`[contact-store] ${what}:`, (err as { code?: string }).code ?? (err as Error).name);

/**
 * Saves an enquiry once per submissionId. A retry of the same submission returns the existing
 * row (and its email status) instead of inserting a duplicate.
 */
export async function storeEnquiry(submissionId: string, fields: ContactFields, media?: MediaMeta): Promise<StoredEnquiry | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    return await prisma.contactMessage.upsert({
      where: { submissionId },
      update: {},
      create: {
        submissionId,
        fullName: fields.fullName,
        email: fields.email,
        mobileNumber: fields.mobileNumber || null,
        company: fields.company || null,
        projectType: fields.projectType,
        message: fields.message,
        attachment: media ? { create: media } : undefined,
      },
      select: { id: true, emailStatus: true },
    });
  } catch (err) {
    logError('Could not save enquiry', err);
    return null;
  }
}

export async function setEmailStatus(enquiry: StoredEnquiry | null, emailStatus: 'SENT' | 'FAILED') {
  const prisma = getPrisma();
  if (!prisma || !enquiry) return;
  try {
    await prisma.contactMessage.update({ where: { id: enquiry.id }, data: { emailStatus }, select: { id: true } });
  } catch (err) {
    logError('Could not update email status', err);
  }
}
