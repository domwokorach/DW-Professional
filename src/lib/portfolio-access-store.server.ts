// Server-only persistence for Portfolio Access submissions. Imported by the /api/portfolio-access route and the admin
// page, never by client components. A submission only succeeds once it is saved here; admin reads are only called
// after requireAdminPage, and no public API returns these records.
import type { AccessFields } from '@/lib/portfolio-access';
import { getPrisma } from '@/lib/prisma.server';

const logError = (what: string, err: unknown) =>
  console.error(`[portfolio-access] ${what}:`, (err as { code?: string }).code ?? (err as Error).name);

/** The private admin list of submissions. */
export const ADMIN_PORTFOLIO_ACCESS_PATH = '/admin/portfolio-access';

export type NewAccess = AccessFields & {
  companyNumber: string | null;
  device: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  source: string;
  page: string;
};

export type StoredAccess = { id: string; createdAt: Date; notificationStatus: 'PENDING' | 'SENT' | 'FAILED' };

/** Submissions from this IP within the window (a database-wide limit, unlike the per-instance one). */
export async function recentAccessFromIp(ipAddress: string | null, sinceMs = 60 * 60 * 1000): Promise<number> {
  const prisma = getPrisma();
  if (!prisma || !ipAddress) return 0;
  try {
    return await prisma.portfolioAccess.count({ where: { ipAddress, createdAt: { gte: new Date(Date.now() - sinceMs) } } });
  } catch (err) {
    logError('Could not count recent submissions', err);
    return 0;
  }
}

/**
 * Saves a (cleaned, validated) submission once per submissionId: a double click or a retry returns the existing
 * row instead of inserting a duplicate. Null when storage is unavailable or fails.
 */
export async function storeAccess(submissionId: string, a: NewAccess): Promise<StoredAccess | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const select = { id: true, createdAt: true, notificationStatus: true } as const;
  try {
    const existing = await prisma.portfolioAccess.findUnique({ where: { submissionId }, select });
    if (existing) return existing;
    return await prisma.portfolioAccess.create({
      data: {
        submissionId,
        fullName: a.fullName,
        email: a.email,
        mobile: a.mobile,
        company: a.company || null,
        companyNumber: a.companyNumber,
        device: a.device,
        userAgent: a.userAgent,
        ipAddress: a.ipAddress,
        source: a.source,
        page: a.page,
      },
      select,
    });
  } catch (err) {
    // A concurrent duplicate lost the race on the unique submissionId: return the winner.
    if ((err as { code?: string }).code === 'P2002') {
      return prisma.portfolioAccess.findUnique({ where: { submissionId }, select }).catch(() => null);
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

export type AdminAccess = {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  company: string | null;
  companyNumber: string | null;
  ipAddress: string | null;
  device: string | null;
  notificationStatus: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
};

/** Submissions, newest first. Throws when storage is unavailable, so the page can say so. */
export async function listAccessForAdmin(limit = 500): Promise<{ rows: AdminAccess[]; total: number }> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const [rows, total] = await Promise.all([
    prisma.portfolioAccess.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: {
        id: true, fullName: true, email: true, mobile: true, company: true, companyNumber: true, ipAddress: true,
        device: true, notificationStatus: true, createdAt: true,
      },
    }),
    prisma.portfolioAccess.count(),
  ]);
  return { rows: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), total };
}
