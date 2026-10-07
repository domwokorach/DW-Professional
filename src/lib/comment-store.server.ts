// Server-only persistence for visitor comments ("What people are saying"). Imported by API routes and admin
// pages, never by client components. Public reads select only public columns; admin reads are only called after
// requireAdminSession / requireAdminPage.
import type { CommentFields, CommentStatusValue, PublicComment } from '@/lib/comments';
import { getPrisma } from '@/lib/prisma.server';

const logError = (what: string, err: unknown) =>
  console.error(`[comment-store] ${what}:`, (err as { code?: string }).code ?? (err as Error).name);

export const commentsEnabled = () => getPrisma() !== null;

export const avatarPath = (id: string) => `/api/comments/${encodeURIComponent(id)}/avatar`;

/** Approved comments, newest first, with public fields only. Null if storage is unavailable. */
export async function listApprovedComments(limit = 50): Promise<PublicComment[] | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const rows = await prisma.comment.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, fullName: true, company: true, comment: true, avatarKey: true, createdAt: true, isVerified: true, isItalic: true },
    });
    return rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      company: r.company,
      comment: r.comment,
      avatarUrl: r.avatarKey ? avatarPath(r.id) : null,
      createdAt: r.createdAt.toISOString(),
      isVerified: r.isVerified,
      isItalic: r.isItalic,
    }));
  } catch (err) {
    logError('Could not list comments', err);
    return null;
  }
}

/** Valid comments from this IP in the last hour (a database-wide limit, unlike the per-instance one). */
export async function recentCommentsFromIp(ipAddress: string, sinceMs = 60 * 60 * 1000): Promise<number> {
  const prisma = getPrisma();
  if (!prisma || ipAddress === 'unknown') return 0;
  try {
    return await prisma.comment.count({ where: { ipAddress, createdAt: { gte: new Date(Date.now() - sinceMs) } } });
  } catch (err) {
    logError('Could not count recent comments', err);
    return 0;
  }
}

export type NewComment = CommentFields & {
  companyDetails: {
    companyNumber: string;
    companyStatus: string | null;
    companyType: string | null;
    companyLocality: string | null;
    companyVerified: boolean;
    companyVerificationSource: string;
    companyVerifiedAt: Date | null;
  } | null;
  avatarKey: string | null;
  device: string | null;
  ipAddress: string;
  consentGivenAt: Date;
};

export type StoredComment = { id: string; createdAt: Date; notificationStatus: 'PENDING' | 'SENT' | 'FAILED'; repeat: boolean };

/**
 * Saves a (cleaned, validated) comment as PENDING, once per submissionId, so a double click or a retry returns
 * the existing row instead of inserting a duplicate. The same email posting the same text again within a day is
 * also treated as a repeat. Status and verification are always set here: a visitor can never choose them. Null on
 * failure.
 */
export async function storeComment(submissionId: string, c: NewComment): Promise<StoredComment | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const select = { id: true, createdAt: true, notificationStatus: true } as const;
  try {
    const repeat = await prisma.comment.findFirst({
      where: { email: c.email, comment: c.comment, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      select,
    });
    if (repeat) return { ...repeat, repeat: true };
    const existing = await prisma.comment.findUnique({ where: { submissionId }, select });
    if (existing) return { ...existing, repeat: true };
    const row = await prisma.comment.create({
      data: {
        submissionId,
        fullName: c.fullName,
        email: c.email,
        company: c.company || null,
        companyNumber: c.companyDetails?.companyNumber ?? null,
        companyStatus: c.companyDetails?.companyStatus ?? null,
        companyType: c.companyDetails?.companyType ?? null,
        companyLocality: c.companyDetails?.companyLocality ?? null,
        companyVerified: c.companyDetails?.companyVerified ?? false,
        companyVerificationSource: c.companyDetails?.companyVerificationSource ?? null,
        companyVerifiedAt: c.companyDetails?.companyVerifiedAt ?? null,
        comment: c.comment,
        avatarKey: c.avatarKey,
        device: c.device,
        ipAddress: c.ipAddress,
        consentGiven: true,
        consentGivenAt: c.consentGivenAt,
        status: 'PENDING',
        isVerified: false,
        isItalic: false,
      },
      select,
    });
    return { ...row, repeat: false };
  } catch (err) {
    logError('Could not save comment', err);
    return null;
  }
}

export async function setNotificationStatus(id: string, notificationStatus: 'SENT' | 'FAILED') {
  try {
    await getPrisma()?.comment.update({ where: { id }, data: { notificationStatus } });
  } catch (err) {
    logError('Could not update notification status', err);
  }
}

/** Avatar key of an approved comment (public avatar route), or null. */
export async function approvedAvatarKey(id: string): Promise<string | null> {
  const row = await getPrisma()?.comment.findFirst({ where: { id, status: 'APPROVED' }, select: { avatarKey: true } });
  return row?.avatarKey ?? null;
}

// ---- Admin only (callers must have validated the admin session) ----------------------------------

export type AdminComment = {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  companyNumber: string | null;
  companyStatus: string | null;
  companyType: string | null;
  companyLocality: string | null;
  companyVerified: boolean;
  companyVerificationSource: string | null;
  companyVerifiedAt: string | null;
  comment: string;
  avatarUrl: string | null;
  device: string | null;
  ipAddress: string | null;
  consentGivenAt: string;
  status: CommentStatusValue;
  notificationStatus: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  moderatedAt: string | null;
  moderatedBy: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  isItalic: boolean;
};

export async function adminAvatarKey(id: string): Promise<string | null> {
  const row = await getPrisma()?.comment.findUnique({ where: { id }, select: { avatarKey: true } });
  return row?.avatarKey ?? null;
}

export async function listCommentsForAdmin(status: CommentStatusValue, limit = 200): Promise<AdminComment[]> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const rows = await prisma.comment.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, fullName: true, email: true, company: true, companyNumber: true, companyStatus: true,
      companyType: true, companyLocality: true, companyVerified: true, companyVerificationSource: true,
      companyVerifiedAt: true, comment: true, avatarKey: true, device: true,
      ipAddress: true, consentGivenAt: true, status: true, notificationStatus: true, createdAt: true, moderatedAt: true,
      moderatedBy: { select: { email: true } },
      isVerified: true, verifiedAt: true, verifiedBy: { select: { email: true } }, isItalic: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    company: r.company,
    companyNumber: r.companyNumber,
    companyStatus: r.companyStatus,
    companyType: r.companyType,
    companyLocality: r.companyLocality,
    companyVerified: r.companyVerified,
    companyVerificationSource: r.companyVerificationSource,
    companyVerifiedAt: r.companyVerifiedAt?.toISOString() ?? null,
    comment: r.comment,
    avatarUrl: r.avatarKey ? avatarPath(r.id) : null,
    device: r.device,
    ipAddress: r.ipAddress,
    consentGivenAt: r.consentGivenAt.toISOString(),
    status: r.status,
    notificationStatus: r.notificationStatus,
    createdAt: r.createdAt.toISOString(),
    moderatedAt: r.moderatedAt?.toISOString() ?? null,
    moderatedBy: r.moderatedBy?.email ?? null,
    isVerified: r.isVerified,
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
    verifiedBy: r.verifiedBy?.email ?? null,
    isItalic: r.isItalic,
  }));
}

export async function countCommentsByStatus(): Promise<Record<CommentStatusValue, number>> {
  const prisma = getPrisma();
  const counts: Record<CommentStatusValue, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  if (!prisma) return counts;
  const groups = await prisma.comment.groupBy({ by: ['status'], _count: { _all: true } });
  groups.forEach((g) => { counts[g.status] = g._count._all; });
  return counts;
}

/**
 * Moves a comment to APPROVED or REJECTED. Approve works from PENDING or REJECTED; reject from PENDING or
 * APPROVED (which unpublishes it, and clears any verification: re-approving never brings the badge back by
 * itself). Returns 'not_found' / 'unchanged' when there's nothing to do.
 */
export async function moderateComment(id: string, to: 'APPROVED' | 'REJECTED', adminUserId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const from: CommentStatusValue[] = to === 'APPROVED' ? ['PENDING', 'REJECTED'] : ['PENDING', 'APPROVED'];
  const { count } = await prisma.comment.updateMany({
    where: { id, status: { in: from } },
    data: {
      status: to,
      moderatedAt: new Date(),
      moderatedById: adminUserId,
      ...(to === 'REJECTED' ? { isVerified: false, verifiedAt: null, verifiedById: null } : {}),
    },
  });
  if (count) return 'ok' as const;
  const exists = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
  return exists ? ('unchanged' as const) : ('not_found' as const);
}

/**
 * Marks an APPROVED comment as verified (or removes that). Only approved comments can be verified, so a pending
 * one never carries the badge. Returns 'not_found' / 'unchanged' when there's nothing to do.
 */
export async function setCommentVerified(id: string, verified: boolean, adminUserId: string) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const { count } = await prisma.comment.updateMany({
    where: { id, status: 'APPROVED', isVerified: !verified },
    data: verified
      ? { isVerified: true, verifiedAt: new Date(), verifiedById: adminUserId }
      : { isVerified: false, verifiedAt: null, verifiedById: null },
  });
  if (count) return 'ok' as const;
  const exists = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
  return exists ? ('unchanged' as const) : ('not_found' as const);
}

/**
 * Shows a comment's text in italics on the public card (or stops). Works in any status, so it can be set before
 * approval. Returns 'not_found' / 'unchanged' when there's nothing to do.
 */
export async function setCommentItalic(id: string, italic: boolean) {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  const { count } = await prisma.comment.updateMany({ where: { id, isItalic: !italic }, data: { isItalic: italic } });
  if (count) return 'ok' as const;
  const exists = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
  return exists ? ('unchanged' as const) : ('not_found' as const);
}

/** Permanently deletes a comment. Returns its avatar key (for S3 clean-up), or 'not_found'. */
export async function deleteComment(id: string): Promise<{ avatarKey: string | null } | 'not_found'> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('Database is not configured');
  try {
    const row = await prisma.comment.delete({ where: { id }, select: { avatarKey: true } });
    return { avatarKey: row.avatarKey };
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return 'not_found';
    throw err;
  }
}
