// Server-only: records security-relevant admin events. Never stores passwords or tokens, and never throws.
import type { AdminAuditEvent } from '../../../generated/prisma/client';
import { getPrisma } from '@/lib/prisma.server';
import { clientIp, userAgent } from '@/lib/request.server';

export async function audit(
  event: AdminAuditEvent,
  opts: { adminUserId?: string | null; commentId?: string; portfolioAccessId?: string; request?: Request } = {},
) {
  try {
    await getPrisma()?.adminAuditLog.create({
      data: {
        event,
        adminUserId: opts.adminUserId ?? null,
        commentId: opts.commentId ?? null,
        portfolioAccessId: opts.portfolioAccessId ?? null,
        ipAddress: opts.request ? clientIp(opts.request) : null,
        userAgent: opts.request ? userAgent(opts.request) : null,
      },
    });
  } catch (err) {
    console.error('[admin-audit] Could not record event:', event, (err as Error).name);
  }
}
