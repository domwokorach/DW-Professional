// Server-only persistence for Portfolio Access sessions. Imported by the /api/portfolio-access route and the admin
// pages, never by client components. A submission only succeeds once it is saved here; admin reads are only called
// after requireAdminPage / requireAdminSession, and no public API returns these records.
//
// One session per email address (case-insensitive): a repeat submission updates the candidate's session (latest
// details, IP and device, submission count) and adds any new file, instead of creating another record.
import type { AccessFields } from '@/lib/portfolio-access';
import { getPrisma } from '@/lib/prisma.server';

const logError = (what: string, err: unknown) =>
  console.error(`[portfolio-access] ${what}:`, (err as { code?: string }).code ?? (err as Error).name);

/** The private admin list of sessions (defined with the shared rules so client components can link to it). */
export { ADMIN_SESSIONS_PATH as ADMIN_PORTFOLIO_ACCESS_PATH, adminSessionPath } from '@/lib/portfolio-access';

export type NewAccess = AccessFields & {
  companyNumber: string | null;
  device: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  source: string;
  page: string;
};

/** The optional Upload / Camera file, already checked by the route (type from its signature, at most 4 MB). */
export type NewAttachment = { filename: string; mimeType: string; size: number; source: 'upload' | 'camera'; data: Buffer };

export type StoredAccess = {
  id: string;
  /** This submission's time (the session's latest). */
  submittedAt: Date;
  submissionCount: number;
  notificationStatus: 'PENDING' | 'SENT' | 'FAILED';
  /** A retry of a submission that was already saved: nothing was written again. */
  repeat: boolean;
};

/** Submissions from this IP within the window (a database-wide limit, unlike the per-instance one). */
export async function recentAccessFromIp(ipAddress: string | null, sinceMs = 60 * 60 * 1000): Promise<number> {
  const prisma = getPrisma();
  if (!prisma || !ipAddress) return 0;
  try {
    return await prisma.portfolioAccess.count({ where: { ipAddress, lastSubmittedAt: { gte: new Date(Date.now() - sinceMs) } } });
  } catch (err) {
    logError('Could not count recent submissions', err);
    return 0;
  }
}

const storedSelect = { id: true, lastSubmittedAt: true, submissionCount: true, notificationStatus: true } as const;
const toStored = (r: { id: string; lastSubmittedAt: Date; submissionCount: number; notificationStatus: StoredAccess['notificationStatus'] }, repeat: boolean): StoredAccess =>
  ({ id: r.id, submittedAt: r.lastSubmittedAt, submissionCount: r.submissionCount, notificationStatus: r.notificationStatus, repeat });

/**
 * Saves a (cleaned, validated) submission into the candidate's session, in one transaction with its file:
 * - a retry of a submission already saved (same submissionId) changes nothing and is reported as a repeat;
 * - an email that already has a session updates it: required details and IP/device are replaced, optional ones
 *   only when given (so an empty field doesn't wipe an earlier link), the count goes up, and the file is added;
 * - otherwise a new session is created.
 * Null when storage is unavailable or fails, so the route reports a failure and the CV doesn't open.
 */
export async function storeAccess(submissionId: string, a: NewAccess, file?: NewAttachment): Promise<StoredAccess | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const emailKey = a.email.toLowerCase();
  const now = new Date();
  // createdAt = the submission's time, so a file can be matched to the submission it came with.
  const attachments = file ? { create: { ...file, data: new Uint8Array(file.data), createdAt: now } } : undefined;
  try {
    return await prisma.$transaction(async (tx) => {
      const repeat = await tx.portfolioAccess.findFirst({
        where: { OR: [{ submissionId }, { lastSubmissionId: submissionId }] },
        select: storedSelect,
      });
      if (repeat) return toStored(repeat, true);

      const session = await tx.portfolioAccess.findFirst({
        where: { emailKey },
        orderBy: { lastSubmittedAt: 'desc' },
        select: { id: true },
      });
      if (session) {
        const updated = await tx.portfolioAccess.update({
          where: { id: session.id },
          data: {
            lastSubmissionId: submissionId,
            fullName: a.fullName,
            email: a.email,
            mobile: a.mobile,
            ...(a.company ? { company: a.company, companyNumber: a.companyNumber } : {}),
            ...(a.linkedin ? { linkedinUrl: a.linkedin } : {}),
            ...(a.companyWebsite ? { companyWebsite: a.companyWebsite } : {}),
            ...(a.portfolio ? { portfolioUrl: a.portfolio } : {}),
            device: a.device,
            userAgent: a.userAgent,
            ipAddress: a.ipAddress,
            source: a.source,
            page: a.page,
            notificationStatus: 'PENDING',
            submissionCount: { increment: 1 },
            lastSubmittedAt: now,
            attachments,
          },
          select: storedSelect,
        });
        return toStored(updated, false);
      }

      const created = await tx.portfolioAccess.create({
        data: {
          submissionId,
          lastSubmissionId: submissionId,
          fullName: a.fullName,
          email: a.email,
          emailKey,
          mobile: a.mobile,
          company: a.company || null,
          companyNumber: a.companyNumber,
          linkedinUrl: a.linkedin || null,
          companyWebsite: a.companyWebsite || null,
          portfolioUrl: a.portfolio || null,
          device: a.device,
          userAgent: a.userAgent,
          ipAddress: a.ipAddress,
          source: a.source,
          page: a.page,
          createdAt: now,
          lastSubmittedAt: now,
          attachments,
        },
        select: storedSelect,
      });
      return toStored(created, false);
    });
  } catch (err) {
    // A concurrent duplicate lost the race on the unique submissionId: report the winner as a repeat.
    if ((err as { code?: string }).code === 'P2002') {
      const winner = await prisma.portfolioAccess.findUnique({ where: { submissionId }, select: storedSelect }).catch(() => null);
      return winner ? toStored(winner, true) : null;
    }
    logError('Could not save submission', err);
    return null;
  }
}

export async function setAccessNotificationStatus(stored: StoredAccess | null, notificationStatus: 'SENT' | 'FAILED') {
  if (!stored) return;
  try {
    await getPrisma()?.portfolioAccess.update({ where: { id: stored.id }, data: { notificationStatus } });
  } catch (err) {
    logError('Could not update notification status', err);
  }
}

// ---- Admin only (callers must have validated the admin session) ----------------------------------

export type AdminFile = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  source: string;
  createdAt: string;
};

export type AdminAccess = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  company: string | null;
  companyNumber: string | null;
  linkedinUrl: string | null;
  companyWebsite: string | null;
  portfolioUrl: string | null;
  ipAddress: string | null;
  device: string | null;
  notificationStatus: 'PENDING' | 'SENT' | 'FAILED';
  submissionCount: number;
  createdAt: string;
  lastSubmittedAt: string;
  /** Metadata only, newest first: files are served by /api/admin/portfolio-access/files/[id]. */
  attachments: AdminFile[];
};

export type AdminSession = AdminAccess & { userAgent: string | null; source: string; page: string };

const fileSelect = { id: true, filename: true, mimeType: true, size: true, source: true, createdAt: true } as const;
const adminSelect = {
  id: true, fullName: true, email: true, mobile: true, company: true, companyNumber: true, linkedinUrl: true,
  companyWebsite: true, portfolioUrl: true, ipAddress: true, device: true, notificationStatus: true,
  submissionCount: true, createdAt: true, lastSubmittedAt: true,
  attachments: { select: fileSelect, orderBy: { createdAt: 'desc' } },
} as const;

type Row = {
  createdAt: Date;
  lastSubmittedAt: Date;
  attachments: { id: string; filename: string; mimeType: string; size: number; source: string; createdAt: Date }[];
};
const serialise = <T extends Row>(r: T) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  lastSubmittedAt: r.lastSubmittedAt.toISOString(),
  attachments: r.attachments.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
});

/** Sessions, most recently submitted first. Throws when storage is unavailable, so the page can say so. */
export async function listAccessForAdmin(limit = 500): Promise<{ rows: AdminAccess[]; total: number }> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const [rows, total] = await Promise.all([
    prisma.portfolioAccess.findMany({ orderBy: [{ lastSubmittedAt: 'desc' }, { id: 'desc' }], take: limit, select: adminSelect }),
    prisma.portfolioAccess.count(),
  ]);
  return { rows: rows.map(serialise), total };
}

/** One session with everything the candidate submitted. Null when it doesn't exist. */
export async function getAccessForAdmin(id: string): Promise<AdminSession | null> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const row = await prisma.portfolioAccess.findUnique({
    where: { id },
    select: { ...adminSelect, userAgent: true, source: true, page: true },
  });
  return row ? serialise(row) : null;
}

/** Permanently deletes one session and its files. 'not_found' when it no longer exists (e.g. already deleted). */
export async function deleteAccess(id: string): Promise<'ok' | 'not_found'> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const { count } = await prisma.portfolioAccess.deleteMany({ where: { id } });
  return count ? 'ok' : 'not_found';
}

/** One stored file, for the admin preview / download route. Null when there is none. */
export async function getAccessFile(fileId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  return prisma.portfolioAccessFile.findUnique({ where: { id: fileId }, select: { filename: true, mimeType: true, size: true, data: true } });
}
