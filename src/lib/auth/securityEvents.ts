import { db } from "@/lib/database/db";
import type { Prisma, SecurityEventType } from "@prisma/client";

export async function logSecurityEvent(params: {
  userId: string;
  type: SecurityEventType;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.securityEvent.create({
    data: {
      userId: params.userId,
      type: params.type,
      sessionId: params.sessionId ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
