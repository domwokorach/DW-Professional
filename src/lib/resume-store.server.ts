// Server-only persistence and rules for résumé requests. Imported by the /api/resume routes and the admin pages,
// never by client components. Verification is automatic (no admin approval): a correct PIN or link marks the
// request VERIFIED and issues a short-lived download grant. Secrets are stored only as keyed hashes.
import { createHash } from 'node:crypto';
import {
  CODE_TTL_MS, GRANT_TTL_MS, MAX_PIN_ATTEMPTS, MAX_SENDS, RESEND_COOLDOWN_MS, RETENTION_DAYS, type ResumeFields,
  cleanResume,
} from '@/lib/resume-access';
import { hashGrant, hashPin, hashToken, newPin, newToken, sameHash } from '@/lib/resume-crypto.server';
import { getPrisma } from '@/lib/prisma.server';
import type { DeviceInfo } from '@/lib/device';
import type { ResumeCompany } from '@/lib/resume-company.server';

/** Static, secret-free hints for the Prisma errors seen when migrations have not been applied to this database. */
const SCHEMA_HINTS: Record<string, string> = {
  P2021: 'a résumé table is missing in this database: apply the migrations (npm run db:deploy) to the database in DATABASE_URL',
  P2022: 'a résumé column is missing in this database: apply the migrations (npm run db:deploy) to the database in DATABASE_URL',
};
const logError = (what: string, err: unknown) => {
  const code = (err as { code?: string }).code ?? (err as Error).name;
  console.error(`[resume] ${what}:`, code, SCHEMA_HINTS[code] ?? '');
};

export type RequestMeta = DeviceInfo & { ipAddress: string | null; userAgent: string | null };

/** The one-time secrets for an email that is about to be sent. Never stored or logged in this form. */
export type IssuedCode = { id: string; pin: string; token: string; expiresAt: Date };
export type RequestResult =
  | { kind: 'issued'; code: IssuedCode; fullName: string; email: string }
  | { kind: 'cooldown'; id: string; expiresAt: Date | null }
  | { kind: 'unavailable' };

const HOUR = 60 * 60 * 1000;

/** Valid requests from this IP in the last hour (database-wide, unlike the per-instance limiter). */
export async function recentResumeFromIp(ipAddress: string | null, sinceMs = HOUR): Promise<number> {
  const prisma = getPrisma();
  if (!prisma || !ipAddress) return 0;
  try {
    return await prisma.resumeAccess.count({ where: { ipAddress, lastActivityAt: { gte: new Date(Date.now() - sinceMs) } } });
  } catch (err) {
    logError('Could not count recent requests', err);
    return 0;
  }
}

function freshCode(id: string, now: number) {
  const pin = newPin();
  const token = newToken();
  const expiresAt = new Date(now + CODE_TTL_MS);
  return { pin, token, expiresAt, data: { pinHash: hashPin(id, pin), tokenHash: hashToken(token), expiresAt, failedAttempts: 0 } };
}

/**
 * Creates or updates the request for this email and issues a new code, unless one was sent less than a cooldown ago
 * (a double click or repeated submission then changes nothing and no second email goes out). A request for an email
 * that is already verified keeps its VERIFIED/DOWNLOADED history but still needs a fresh code before any download.
 */
export async function requestResume(fields: ResumeFields, meta: RequestMeta, company?: ResumeCompany): Promise<RequestResult> {
  const prisma = getPrisma();
  if (!prisma) return { kind: 'unavailable' };
  const c = cleanResume(fields);
  const now = Date.now();
  try {
    const existing = await prisma.resumeAccess.findUnique({ where: { emailKey: c.emailKey } });
    const details = {
      fullName: c.fullName, email: c.email, company: company?.name ?? c.company, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      deviceType: meta.deviceType, deviceModel: meta.deviceModel, os: meta.os, browser: meta.browser, lastActivityAt: new Date(now),
      // The checked company (official name and details) replaces the typed text; without one it is a manual entry.
      ...(company
        ? { companyNumber: company.number, companyStatus: company.status, companyLocation: company.location, companySource: company.source, companyVerifiedAt: company.verifiedAt }
        : { companyNumber: null, companyStatus: null, companyLocation: null, companySource: 'manual', companyVerifiedAt: null }),
    };

    if (existing?.lastSentAt && now - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS && existing.pinHash) {
      await prisma.resumeAccess.update({ where: { id: existing.id }, data: details });
      return { kind: 'cooldown', id: existing.id, expiresAt: existing.expiresAt };
    }

    const recordId = existing?.id ?? (await prisma.resumeAccess.create({ data: { ...details, emailKey: c.emailKey, events: { create: { type: 'REQUESTED' } } }, select: { id: true } })).id;
    const code = freshCode(recordId, now);
    const windowOpen = existing?.lastSentAt && now - existing.lastSentAt.getTime() < HOUR;
    const sends = windowOpen ? existing.sendCount : 0;
    if (sends >= MAX_SENDS) return { kind: 'cooldown', id: recordId, expiresAt: existing?.expiresAt ?? null };
    const verified = existing?.status === 'VERIFIED' || existing?.status === 'DOWNLOADED';
    await prisma.resumeAccess.update({
      where: { id: recordId },
      data: {
        ...details, ...code.data, sendCount: sends + 1, lastSentAt: new Date(now),
        status: verified ? existing.status : 'PENDING_VERIFICATION',
        ...(existing ? { events: { create: { type: 'REQUESTED' } } } : {}),
      },
    });
    return { kind: 'issued', code: { id: recordId, pin: code.pin, token: code.token, expiresAt: code.expiresAt }, fullName: c.fullName, email: c.email };
  } catch (err) {
    logError('Could not save request', err);
    return { kind: 'unavailable' };
  }
}

/** Records whether the verification email actually went out (never claims delivery that did not happen). */
export async function markEmailResult(id: string, sent: boolean, resent = false): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  try {
    const row = await prisma.resumeAccess.findUnique({ where: { id }, select: { status: true } });
    const keep = row?.status === 'VERIFIED' || row?.status === 'DOWNLOADED';
    await prisma.resumeAccess.update({
      where: { id },
      data: {
        ...(keep ? {} : { status: sent ? 'EMAIL_SENT' : 'DELIVERY_FAILED' }),
        ...(sent ? {} : { pinHash: null, tokenHash: null }),
        events: { create: { type: sent ? (resent ? 'RESENT' : 'EMAIL_SENT') : 'EMAIL_FAILED' } },
      },
    });
  } catch (err) {
    logError('Could not record email result', err);
  }
}

export type ResendResult = RequestResult | { kind: 'ignored' };

/** A fresh code for an existing request, within the cooldown and send limits. Unknown ids are silently ignored. */
export async function resendResume(id: string): Promise<ResendResult> {
  const prisma = getPrisma();
  if (!prisma) return { kind: 'unavailable' };
  const now = Date.now();
  try {
    const row = await prisma.resumeAccess.findUnique({ where: { id } });
    if (!row) return { kind: 'ignored' };
    const windowOpen = row.lastSentAt && now - row.lastSentAt.getTime() < HOUR;
    const sends = windowOpen ? row.sendCount : 0;
    if ((row.lastSentAt && now - row.lastSentAt.getTime() < RESEND_COOLDOWN_MS) || sends >= MAX_SENDS) {
      return { kind: 'cooldown', id, expiresAt: row.expiresAt };
    }
    const code = freshCode(id, now);
    await prisma.resumeAccess.update({
      where: { id },
      data: { ...code.data, sendCount: sends + 1, lastSentAt: new Date(now), lastActivityAt: new Date(now) },
    });
    return { kind: 'issued', code: { id, pin: code.pin, token: code.token, expiresAt: code.expiresAt }, fullName: row.fullName, email: row.email };
  } catch (err) {
    logError('Could not resend', err);
    return { kind: 'unavailable' };
  }
}

export type VerifyResult =
  | { ok: true; grant: string; grantExpiresAt: Date }
  | { ok: false; reason: 'invalid' | 'expired' | 'locked' | 'unavailable' };

/** Marks a request verified and issues the download grant. The caller has already proven the PIN or token. */
async function grantAccess(id: string, extra: object): Promise<VerifyResult> {
  const prisma = getPrisma()!;
  const grant = newToken();
  const grantExpiresAt = new Date(Date.now() + GRANT_TTL_MS);
  const row = await prisma.resumeAccess.findUnique({ where: { id }, select: { status: true } });
  await prisma.resumeAccess.update({
    where: { id },
    data: {
      ...extra,
      // Single use: the PIN and token are gone the moment either one succeeds.
      pinHash: null, tokenHash: null, failedAttempts: 0,
      status: row?.status === 'DOWNLOADED' ? 'DOWNLOADED' : 'VERIFIED',
      verifiedAt: new Date(), grantHash: hashGrant(grant), grantExpiresAt, lastActivityAt: new Date(),
      events: { create: { type: 'VERIFIED' } },
    },
  });
  return { ok: true, grant, grantExpiresAt };
}

/** Checks a six-digit PIN. Wrong guesses are counted on the record; after MAX_PIN_ATTEMPTS the code is burned. */
export async function verifyPin(id: string, pin: string): Promise<VerifyResult> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, reason: 'unavailable' };
  try {
    const row = await prisma.resumeAccess.findUnique({ where: { id }, select: { pinHash: true, expiresAt: true, failedAttempts: true } });
    if (!row || !row.pinHash) return { ok: false, reason: 'invalid' };
    if (!row.expiresAt || row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'expired' };
    if (row.failedAttempts >= MAX_PIN_ATTEMPTS) return { ok: false, reason: 'locked' };

    if (!sameHash(row.pinHash, hashPin(id, pin))) {
      const updated = await prisma.resumeAccess.update({
        where: { id },
        data: { failedAttempts: { increment: 1 }, lastActivityAt: new Date(), events: { create: { type: 'VERIFY_FAILED' } } },
        select: { failedAttempts: true },
      });
      if (updated.failedAttempts >= MAX_PIN_ATTEMPTS) {
        await prisma.resumeAccess.update({ where: { id }, data: { pinHash: null, tokenHash: null } });
        return { ok: false, reason: 'locked' };
      }
      return { ok: false, reason: 'invalid' };
    }
    // Atomic claim: if two requests race with the right PIN, only one clears the hash and wins.
    const claimed = await prisma.resumeAccess.updateMany({ where: { id, pinHash: row.pinHash, expiresAt: { gt: new Date() } }, data: { pinHash: null, tokenHash: null } });
    if (claimed.count !== 1) return { ok: false, reason: 'invalid' };
    return await grantAccess(id, {});
  } catch (err) {
    logError('Could not verify PIN', err);
    return { ok: false, reason: 'unavailable' };
  }
}

/** Checks the emailed link's token. Single use: the first success consumes it, a replay is simply invalid. */
export async function verifyToken(token: string): Promise<VerifyResult> {
  const prisma = getPrisma();
  if (!prisma) return { ok: false, reason: 'unavailable' };
  try {
    const hash = hashToken(token);
    const row = await prisma.resumeAccess.findUnique({ where: { tokenHash: hash }, select: { id: true, expiresAt: true } });
    if (!row) return { ok: false, reason: 'invalid' };
    if (!row.expiresAt || row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'expired' };
    const claimed = await prisma.resumeAccess.updateMany({ where: { id: row.id, tokenHash: hash, expiresAt: { gt: new Date() } }, data: { pinHash: null, tokenHash: null } });
    if (claimed.count !== 1) return { ok: false, reason: 'invalid' };
    return await grantAccess(row.id, {});
  } catch (err) {
    logError('Could not verify token', err);
    return { ok: false, reason: 'unavailable' };
  }
}

export type DownloadFile = { filename: string; data: Buffer; size: number; sha256: string };

/**
 * The protected PDF, only for a valid, unexpired download grant. Each served download is counted and timestamped.
 * Returns null for a missing/expired grant or when no résumé has been imported.
 */
export async function authoriseDownload(grant: string): Promise<DownloadFile | 'none' | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const row = await prisma.resumeAccess.findUnique({ where: { grantHash: hashGrant(grant) }, select: { id: true, grantExpiresAt: true } });
    if (!row?.grantExpiresAt || row.grantExpiresAt.getTime() <= Date.now()) return null;
    const file = await prisma.resumeFile.findUnique({ where: { id: 'current' } });
    if (!file) return 'none';
    const now = new Date();
    const first = await prisma.resumeAccess.findUnique({ where: { id: row.id }, select: { firstDownloadedAt: true } });
    await prisma.resumeAccess.update({
      where: { id: row.id },
      data: {
        status: 'DOWNLOADED', downloadCount: { increment: 1 }, lastDownloadedAt: now, lastActivityAt: now,
        ...(first?.firstDownloadedAt ? {} : { firstDownloadedAt: now }),
        events: { create: { type: 'DOWNLOADED' } },
      },
    });
    return { filename: file.filename, data: Buffer.from(file.data), size: file.size, sha256: file.sha256 };
  } catch (err) {
    logError('Could not authorise download', err);
    return null;
  }
}

/**
 * The current résumé PDF with no grant check, for the explicitly public recruiter route (the QR code on the Developer ID
 * card). Nothing is counted or recorded. 'none' when no résumé has been imported, 'error' when storage fails.
 */
export async function readCurrentResume(): Promise<{ data: Buffer; size: number } | 'none' | 'error'> {
  const prisma = getPrisma();
  if (!prisma) return 'error';
  try {
    const file = await prisma.resumeFile.findUnique({ where: { id: 'current' }, select: { data: true } });
    if (!file) return 'none';
    const data = Buffer.from(file.data);
    return { data, size: data.length };
  } catch (err) {
    logError('Could not read the résumé file', err);
    return 'error';
  }
}

/** Replaces the protected résumé (used by `npm run resume:import`). */
export async function storeResumeFile(filename: string, data: Buffer): Promise<{ size: number; sha256: string }> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('No database configured');
  const sha256 = createHash('sha256').update(data).digest('hex');
  const bytes = new Uint8Array(data);
  await prisma.resumeFile.upsert({
    where: { id: 'current' },
    create: { id: 'current', filename, size: data.length, sha256, data: bytes },
    update: { filename, size: data.length, sha256, data: bytes },
  });
  return { size: data.length, sha256 };
}

export type AdminResume = {
  id: string; fullName: string; email: string; company: string; source: string;
  companyNumber: string | null; companyStatus: string | null; companyLocation: string | null;
  companySource: 'companies_house' | 'company_database' | 'manual'; companyVerifiedAt: string | null;
  status: 'PENDING_VERIFICATION' | 'EMAIL_SENT' | 'DELIVERY_FAILED' | 'VERIFIED' | 'DOWNLOADED';
  expiresAt: string | null; createdAt: string; verifiedAt: string | null; lastDownloadedAt: string | null; lastActivityAt: string;
  ipAddress: string | null; browser: string | null; deviceType: string | null; deviceModel: string | null; os: string | null; downloadCount: number;
};

/** All résumé requests, newest activity first. Only called after requireAdminPage / requireAdminSession. */
export async function listResumeForAdmin(limit = 500): Promise<{ rows: AdminResume[]; total: number }> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('No database configured');
  const [rows, total] = await Promise.all([
    prisma.resumeAccess.findMany({ orderBy: { lastActivityAt: 'desc' }, take: limit }),
    prisma.resumeAccess.count(),
  ]);
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return {
    total,
    rows: rows.map((r) => ({
      id: r.id, fullName: r.fullName, email: r.email, company: r.company, source: r.source, status: r.status,
      companyNumber: r.companyNumber, companyStatus: r.companyStatus, companyLocation: r.companyLocation,
      companySource: r.companySource as AdminResume['companySource'], companyVerifiedAt: iso(r.companyVerifiedAt),
      expiresAt: iso(r.expiresAt), createdAt: r.createdAt.toISOString(), verifiedAt: iso(r.verifiedAt),
      lastDownloadedAt: iso(r.lastDownloadedAt), lastActivityAt: r.lastActivityAt.toISOString(), ipAddress: r.ipAddress,
      browser: r.browser, deviceType: r.deviceType, deviceModel: r.deviceModel, os: r.os, downloadCount: r.downloadCount,
    })),
  };
}

/** Deletes requests (and their events) with no activity for RETENTION_DAYS. Run by `npm run resume:purge`. */
export async function purgeOldResumeRecords(days = RETENTION_DAYS): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('No database configured');
  const { count } = await prisma.resumeAccess.deleteMany({ where: { lastActivityAt: { lt: new Date(Date.now() - days * 24 * HOUR) } } });
  return count;
}
