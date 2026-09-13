import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { verifyEmailChangeSchema } from "@/lib/auth/validation";
import { apiError, validationError } from "@/lib/auth/apiError";
import { hashToken } from "@/lib/auth/tokens";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/auth/securityEvents";
import { extractClientIp } from "@/lib/auth/device";
import { sendEmailChangedEmail } from "@/services/email/email.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = verifyEmailChangeSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const tokenHash = hashToken(parsed.data.token);
  const changeRequest = await db.emailChangeRequest.findUnique({ where: { tokenHash } });

  if (!changeRequest || changeRequest.verifiedAt) {
    return apiError("invalid_token", "This verification link is invalid or has already been used.", 400);
  }
  if (changeRequest.expiresAt.getTime() < Date.now()) {
    return apiError("expired_token", "This verification link has expired. Request the change again.", 400);
  }

  const emailInUse = await db.user.findUnique({ where: { email: changeRequest.newEmail } });
  if (emailInUse) {
    return apiError("email_in_use", "That email address is now in use by another account.", 409);
  }

  const user = await db.user.findUnique({ where: { id: changeRequest.userId } });
  if (!user) return apiError("not_found", "Account not found.", 404);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { email: changeRequest.newEmail, emailVerifiedAt: new Date() },
    }),
    db.emailChangeRequest.update({ where: { id: changeRequest.id }, data: { verifiedAt: new Date() } }),
  ]);

  // The email is part of the token's identity claims — force re-authentication
  // everywhere so no stale session keeps referencing the old address.
  await revokeAllSessionsForUser(user.id);

  await logSecurityEvent({
    userId: user.id,
    type: "EMAIL_CHANGED",
    ipAddress: extractClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
    metadata: { oldEmail: changeRequest.oldEmail, newEmail: changeRequest.newEmail },
  });

  void sendEmailChangedEmail({
    to: changeRequest.oldEmail,
    newEmail: changeRequest.newEmail,
    occurredAt: new Date().toLocaleString("en-GB"),
  });

  return NextResponse.json({ ok: true, message: "Email address updated. Please sign in again." });
}
